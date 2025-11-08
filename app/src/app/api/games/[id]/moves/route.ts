import { NextRequest, NextResponse } from 'next/server';
import type { DocumentData } from 'firebase-admin/firestore';

import { adminAuth, adminFirestore, serverTimestamp } from '@/lib/firebase-admin';
import { BANQI_COLUMNS, BANQI_ROWS, PIECE_COLORS, PIECE_TYPES } from '@/lib/banqi/constants';
import { reconstructBoardFromMoves } from '@/lib/banqi/state';
import {
  assignColorsFromFirstFlip,
  findPlayer,
  hasTwoPlayers,
  nextTurnFor,
  sanitizeGameDocument,
} from '@/lib/banqi/game';
import {
  BoardPosition,
  BoardState,
  GameDocument,
  Move,
  MoveType,
  NewMovePayload,
  Piece,
  PieceColor,
  PieceType,
} from '@/lib/banqi/types';
import { BanqiValidationError, validateMove } from '@/lib/banqi/validation';

const isString = (value: unknown): value is string => typeof value === 'string';

const extractBearerToken = (request: NextRequest): string | null => {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice('Bearer '.length).trim() || null;
};

const authenticateRequest = async (request: NextRequest): Promise<string> => {
  const token = extractBearerToken(request);
  if (!token) {
    throw new ResponseError('Unauthorized', 401);
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.error('Failed to verify ID token', error);
    throw new ResponseError('Unauthorized', 401);
  }
};

class ResponseError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const ensureGameAccess = (game: GameDocument | undefined, uid: string): GameDocument => {
  if (!game) {
    throw new ResponseError('Game not found', 404);
  }
  const sanitized = sanitizeGameDocument(game);
  if (sanitized.status === 'finished') {
    throw new ResponseError('Game is already finished', 409);
  }
  if (!findPlayer(sanitized, uid)) {
    throw new ResponseError('Forbidden', 403);
  }
  return sanitized;
};

const isValidPieceType = (value: unknown): value is PieceType =>
  typeof value === 'string' && (PIECE_TYPES as readonly string[]).includes(value);

const isValidPieceColor = (value: unknown): value is PieceColor =>
  typeof value === 'string' && (PIECE_COLORS as readonly string[]).includes(value);

const parsePosition = (value: unknown, field: string): BoardPosition => {
  if (typeof value !== 'object' || value === null) {
    throw new ResponseError(`Invalid "${field}" payload`, 400);
  }
  const { row, col } = value as { row?: unknown; col?: unknown };
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    throw new ResponseError(`"${field}" row and col must be integers`, 400);
  }
  if (row < 0 || row >= BANQI_ROWS || col < 0 || col >= BANQI_COLUMNS) {
    throw new ResponseError(`"${field}" is out of bounds`, 400);
  }
  return { row: row as number, col: col as number };
};

const parsePiece = (value: unknown, field: string): Piece => {
  if (typeof value !== 'object' || value === null) {
    throw new ResponseError(`Invalid "${field}" payload`, 400);
  }
  const { type, color } = value as { type?: unknown; color?: unknown };
  if (!isValidPieceType(type)) {
    throw new ResponseError(`Invalid "${field}.type"`, 400);
  }
  if (!isValidPieceColor(color)) {
    throw new ResponseError(`Invalid "${field}.color"`, 400);
  }
  return { type, color };
};

const isMoveType = (value: unknown): value is MoveType =>
  typeof value === 'string' && ['flip', 'move', 'capture'].includes(value);

const parseMovePayload = (body: unknown): NewMovePayload => {
  if (typeof body !== 'object' || body === null) {
    throw new ResponseError('Invalid request body', 400);
  }

  const { type } = body as { type?: unknown };

  if (!isMoveType(type)) {
    throw new ResponseError('Invalid or missing move type', 400);
  }

  switch (type) {
    case 'flip':
      return {
        type,
        position: parsePosition((body as Record<string, unknown>).position, 'position'),
      };
    case 'move':
      return {
        type,
        from: parsePosition((body as Record<string, unknown>).from, 'from'),
        to: parsePosition((body as Record<string, unknown>).to, 'to'),
      };
    case 'capture':
      return {
        type,
        from: parsePosition((body as Record<string, unknown>).from, 'from'),
        to: parsePosition((body as Record<string, unknown>).to, 'to'),
      };
    default:
      throw new ResponseError('Unsupported move type', 400);
  }
};

const toIsoString = (value: unknown): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return null;
};

const deserializeMove = (id: string, data: DocumentData): Move => {
  const { moveNumber, playerId, type, createdAt } = data;

  if (!Number.isInteger(moveNumber)) {
    throw new Error(`Move document "${id}" is missing a valid moveNumber`);
  }
  if (!isString(playerId)) {
    throw new Error(`Move document "${id}" is missing playerId`);
  }
  if (!isMoveType(type)) {
    throw new Error(`Move document "${id}" has invalid type`);
  }

  const base = {
    id,
    moveNumber,
    playerId,
    createdAt: toIsoString(createdAt),
    type,
  } as const;

  switch (type) {
    case 'flip':
      return {
        ...base,
        position: parsePosition(data.position, 'position'),
        piece: parsePiece(data.piece, 'piece'),
      };
    case 'move':
      return {
        ...base,
        from: parsePosition(data.from, 'from'),
        to: parsePosition(data.to, 'to'),
      };
    case 'capture':
      return {
        ...base,
        from: parsePosition(data.from, 'from'),
        to: parsePosition(data.to, 'to'),
        capturedPiece: parsePiece(data.capturedPiece, 'capturedPiece'),
      };
    default:
      throw new Error(`Unsupported move type "${type}" encountered during deserialization`);
  }
};

const fetchMoves = async (gameId: string): Promise<Move[]> => {
  const snapshot = await adminFirestore
    .collection('games')
    .doc(gameId)
    .collection('moves')
    .orderBy('moveNumber', 'asc')
    .get();

  return snapshot.docs.map((doc) => deserializeMove(doc.id, doc.data()));
};

const buildGameStateResponse = (moves: Move[]): BoardState & { moves: Move[] } => {
  const boardState = reconstructBoardFromMoves(moves);
  return {
    ...boardState,
    moves,
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const uid = await authenticateRequest(request);
    const gameRef = adminFirestore.collection('games').doc(params.id);
    const gameSnapshot = await gameRef.get();
    const gameData = gameSnapshot.data() as GameDocument | undefined;
    ensureGameAccess(gameData, uid);

    const moves = await fetchMoves(params.id);
    const result = buildGameStateResponse(moves);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to fetch game state', error);
    return NextResponse.json({ error: 'Failed to fetch game state' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const uid = await authenticateRequest(request);
    const gameRef = adminFirestore.collection('games').doc(params.id);
    const gameSnapshot = await gameRef.get();
    const gameData = ensureGameAccess(gameSnapshot.data() as GameDocument | undefined, uid);

    if (!gameData) {
      throw new ResponseError('Game not found', 404);
    }

    if (!hasTwoPlayers(gameData)) {
      throw new ResponseError('Waiting for an opponent before starting the game', 409);
    }

    if (gameData.firstPlayerId) {
      const expectedTurn = gameData.currentTurn ?? nextTurnFor(gameData, gameData.firstPlayerId);
      if (expectedTurn && expectedTurn !== uid) {
        throw new ResponseError('It is not your turn', 409);
      }
    }

    const movePayload = parseMovePayload(await request.json());
    const existingMoves = await fetchMoves(params.id);
    const boardState = reconstructBoardFromMoves(existingMoves);

    const validatedMove = validateMove({
      move: movePayload,
      boardState,
      game: gameData,
      playerId: uid,
    });

    const nextMoveNumber = boardState.lastMoveNumber + 1;

    const moveDocument: Record<string, unknown> = {
      moveNumber: nextMoveNumber,
      playerId: uid,
      type: validatedMove.type,
      createdAt: serverTimestamp(),
    };

    if (validatedMove.type === 'flip') {
      moveDocument.position = validatedMove.position;
      moveDocument.piece = validatedMove.piece;
    } else if (validatedMove.type === 'move') {
      moveDocument.from = validatedMove.from;
      moveDocument.to = validatedMove.to;
    } else if (validatedMove.type === 'capture') {
      moveDocument.from = validatedMove.from;
      moveDocument.to = validatedMove.to;
      moveDocument.capturedPiece = validatedMove.capturedPiece;
    }

    await gameRef.collection('moves').add(moveDocument);

    const gameUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
      lastMoveNumber: nextMoveNumber,
    };
    if (!gameData.firstPlayerId) {
      if (validatedMove.type !== 'flip') {
        throw new ResponseError('The first move of the game must flip a piece', 400);
      }
      const { playerRedId, playerBlackId } = assignColorsFromFirstFlip(
        gameData,
        uid,
        validatedMove.piece.color,
      );
      const nextPlayer = nextTurnFor(gameData, uid);
      gameData.firstPlayerId = uid;
      gameData.currentTurn = nextPlayer;
      gameUpdates.firstPlayerId = uid;
      gameUpdates.playerRedId = playerRedId;
      gameUpdates.playerBlackId = playerBlackId;
      if (nextPlayer) {
        gameUpdates.currentTurn = nextPlayer;
      }
    } else {
      const nextPlayer = nextTurnFor(gameData, uid);
      gameData.currentTurn = nextPlayer;
      if (nextPlayer) {
        gameUpdates.currentTurn = nextPlayer;
      }
    }

    if (gameData.status === 'waiting') {
      gameUpdates.status = 'in_progress';
    }
    await gameRef.update(gameUpdates);

    const moves = await fetchMoves(params.id);
    const result = buildGameStateResponse(moves);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof BanqiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to record move', error);
    return NextResponse.json({ error: 'Failed to record move' }, { status: 500 });
  }
}

