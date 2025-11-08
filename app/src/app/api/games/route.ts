import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const newGame = {
      playerRedId: uid,
      playerBlackId: null,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMoveNumber: 0,
      winner: null,
    };

    const gameRef = await adminFirestore.collection('games').add(newGame);

    return NextResponse.json({ gameId: gameRef.id }, { status: 201 });

  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
