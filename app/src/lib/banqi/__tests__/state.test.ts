import { reconstructBoardFromMoves } from '@/lib/banqi/state';
import type { Move, Piece } from '@/lib/banqi/types';

/// <reference types="jest" />

const makeMoveBase = (overrides: Partial<Move>): Move =>
  ({
    id: 'move-id',
    moveNumber: 1,
    playerId: 'player-red',
    createdAt: null,
    type: 'flip',
    ...overrides,
  }) as Move;

describe('reconstructBoardFromMoves', () => {
  it('returns initial board metadata when no moves have been played', () => {
    const result = reconstructBoardFromMoves([]);

    expect(result.lastMoveNumber).toBe(0);
    expect(result.board).toHaveLength(4);
    expect(result.board.every((row) => row.every((cell) => cell.kind === 'unknown'))).toBe(true);
    expect(result.captures.red).toHaveLength(0);
    expect(result.captures.black).toHaveLength(0);
    expect(result.faceDownPieces).toHaveLength(32);
  });

  it('applies flip, capture, and move operations in order', () => {
    const flips: Move[] = [
      makeMoveBase({
        id: 'flip-red',
        moveNumber: 1,
        type: 'flip',
        playerId: 'player-red',
        position: { row: 0, col: 0 },
        piece: { type: 'guard', color: 'red' },
      }),
      makeMoveBase({
        id: 'flip-black',
        moveNumber: 2,
        type: 'flip',
        playerId: 'player-black',
        position: { row: 0, col: 1 },
        piece: { type: 'guard', color: 'black' },
      }),
    ];

    const capture: Move = makeMoveBase({
      id: 'capture',
      moveNumber: 3,
      type: 'capture',
      playerId: 'player-red',
      from: { row: 0, col: 0 },
      to: { row: 0, col: 1 },
      capturedPiece: { type: 'guard', color: 'black' },
    });

    const move: Move = makeMoveBase({
      id: 'move',
      moveNumber: 4,
      type: 'move',
      playerId: 'player-red',
      from: { row: 0, col: 1 },
      to: { row: 0, col: 0 },
    });

    const result = reconstructBoardFromMoves([...flips, capture, move]);

    expect(result.lastMoveNumber).toBe(4);
    expect(result.board[0][0]).toEqual({ kind: 'piece', piece: { type: 'guard', color: 'red' } });
    expect(result.board[0][1]).toEqual({ kind: 'empty' });
    expect(result.captures.red).toEqual([{ type: 'guard', color: 'black' }]);
    expect(result.captures.black).toHaveLength(0);
    expect(result.faceDownPieces.filter((piece: Piece) => piece.type === 'guard')).toHaveLength(2);
    expect(result.faceDownPieces).toHaveLength(30);
  });

  it('throws when attempting to move onto an unrevealed square', () => {
    const moves: Move[] = [
      makeMoveBase({
        id: 'flip-red',
        moveNumber: 1,
        type: 'flip',
        playerId: 'player-red',
        position: { row: 0, col: 0 },
        piece: { type: 'guard', color: 'red' },
      }),
      makeMoveBase({
        id: 'illegal-move',
        moveNumber: 2,
        type: 'move',
        playerId: 'player-red',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
      }),
    ];

    expect(() => reconstructBoardFromMoves(moves)).toThrow('Cannot move onto an unrevealed square');
  });
});

