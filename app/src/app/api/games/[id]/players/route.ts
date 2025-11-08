import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import {
  addPlayerToGame,
  findPlayer,
  hasTwoPlayers,
  sanitizeGameDocument,
  setPlayerReadyState,
} from '@/lib/banqi/game';
import type { GameDocument } from '@/lib/banqi/types';

class ResponseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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

const loadGame = async (gameId: string): Promise<[FirebaseFirestore.DocumentReference, GameDocument]> => {
  const gameRef = adminFirestore.collection('games').doc(gameId);
  const snapshot = await gameRef.get();
  if (!snapshot.exists) {
    throw new ResponseError('Game not found', 404);
  }
  const rawGame = snapshot.data() as GameDocument;
  const sanitized = sanitizeGameDocument(rawGame);
  return [gameRef, sanitized];
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const uid = await authenticateRequest(request);
    const [gameRef, game] = await loadGame(params.id);

    if (findPlayer(game, uid)) {
      return NextResponse.json({ players: game.players }, { status: 200 });
    }

    if (hasTwoPlayers(game)) {
      return NextResponse.json({ error: 'Game already has two players' }, { status: 409 });
    }

    addPlayerToGame(game, uid);

    await gameRef.update({
      players: game.players,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ players: game.players }, { status: 201 });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to join game', error);
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const uid = await authenticateRequest(request);
    const body = await request.json();
    const ready = Boolean(body?.ready);

    const [gameRef, game] = await loadGame(params.id);
    if (!findPlayer(game, uid)) {
      throw new ResponseError('Forbidden', 403);
    }

    setPlayerReadyState(game, uid, ready);

    await gameRef.update({
      players: game.players,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ players: game.players }, { status: 200 });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to update ready state', error);
    return NextResponse.json({ error: 'Failed to update ready state' }, { status: 500 });
  }
}

