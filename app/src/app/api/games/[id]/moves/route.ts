import { NextRequest, NextResponse } from 'next/server';
import type { DocumentData } from 'firebase-admin/firestore';

import { adminAuth, adminFirestore, serverTimestamp } from '@/lib/firebase-admin';
import { BANQI_COLUMNS, BANQI_ROWS, PIECE_COLORS, PIECE_TYPES } from '@/lib/banqi/constants';
import { reconstructBoardFromMoves } from '@/lib/banqi/state';
import {
  BoardPosition,
  BoardState,
  Move,
  MoveType,
  Piece,
  PieceColor,
  PieceType,
} from '@/lib/banqi/types';

type GameDocument = {
  playerRedId: string | null;
  playerBlackId: string | null;
  status: 'waiting' | 'in_progress' | 'finished';
};

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

const ensureGameAccess = (game: GameDocument | undefined, uid: string) => {
  if (!game) {
    throw new ResponseError('Game not found', 404);
  }
  if (game.status === 'finished') {
    throw new ResponseError('Game is already finished', 409);
  }
  if (game.playerRedId !== uid && game.playerBlackId !== uid) {
    throw new ResponseError('Forbidden', 403);
  }
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

type MovePayload =
  | {
      type: 'flip';
      position: BoardPosition;
      piece: Piece;
    }
  | {
      type: 'move';
      from: BoardPosition;
      to: BoardPosition;
    }
  | {
      type: 'capture';
      from: BoardPosition;
      to: BoardPosition;
      capturedPiece: Piece;
    };

const parseMovePayload = (body: unknown): MovePayload => {
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
        piece: parsePiece((body as Record<string, unknown>).piece, 'piece'),
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
        capturedPiece: parsePiece((body as Record<string, unknown>).capturedPiece, 'capturedPiece'),
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
    const gameData = gameSnapshot.data() as GameDocument | undefined;
    ensureGameAccess(gameData, uid);

    const movePayload = parseMovePayload(await request.json());

    const movesCollection = gameRef.collection('moves');
    const latestMoveSnapshot = await movesCollection.orderBy('moveNumber', 'desc').limit(1).get();
    const nextMoveNumber = latestMoveSnapshot.empty
      ? 1
      : (latestMoveSnapshot.docs[0].data().moveNumber ?? 0) + 1;

    const moveDocument: Record<string, unknown> = {
      moveNumber: nextMoveNumber,
      playerId: uid,
      type: movePayload.type,
      createdAt: serverTimestamp(),
    };

    if (movePayload.type === 'flip') {
      moveDocument.position = movePayload.position;
      moveDocument.piece = movePayload.piece;
    } else if (movePayload.type === 'move') {
      moveDocument.from = movePayload.from;
      moveDocument.to = movePayload.to;
    } else if (movePayload.type === 'capture') {
      moveDocument.from = movePayload.from;
      moveDocument.to = movePayload.to;
      moveDocument.capturedPiece = movePayload.capturedPiece;
    }

    await movesCollection.add(moveDocument);

    const gameUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
      lastMoveNumber: nextMoveNumber,
    };
    if (gameData?.status === 'waiting') {
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
    console.error('Failed to record move', error);
    return NextResponse.json({ error: 'Failed to record move' }, { status: 500 });
  }
}

