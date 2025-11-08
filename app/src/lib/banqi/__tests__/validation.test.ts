/// <reference types="jest" />

import { validateMove, BanqiValidationError } from '@/lib/banqi/validation';
import type { BoardCell, BoardState, GameDocument, NewMovePayload, Piece } from '@/lib/banqi/types';

const createBoard = (): BoardCell[][] =>
  Array.from({ length: 4 }, () =>
    Array.from({ length: 8 }, () => ({ kind: 'unknown' as const })),
  );

const createBaseState = (overrides: Partial<BoardState> = {}): BoardState => ({
  board: createBoard(),
  captures: {
    red: [],
    black: [],
  },
  lastMoveNumber: 0,
  faceDownPieces: [],
  ...overrides,
});

const defaultGame: GameDocument = {
  playerRedId: 'player-red',
  playerBlackId: 'player-black',
  status: 'in_progress',
};

const setPiece = (state: BoardState, position: { row: number; col: number }, piece: Piece) => {
  state.board[position.row][position.col] = { kind: 'piece', piece };
};

const setEmpty = (state: BoardState, position: { row: number; col: number }) => {
  state.board[position.row][position.col] = { kind: 'empty' };
};

describe('validateMove', () => {
  describe('flip moves', () => {
    it('draws a random face-down piece when flipping', () => {
      const state = createBaseState({
        faceDownPieces: [
          { type: 'guard', color: 'red' },
          { type: 'horse', color: 'black' },
        ],
      });
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.1);

      const move: NewMovePayload = {
        type: 'flip',
        position: { row: 0, col: 0 },
      };

      const result = validateMove({
        move,
        boardState: state,
        game: defaultGame,
        playerId: 'player-red',
      });

      if (result.type !== 'flip') {
        throw new Error('Expected validated flip move');
      }

      expect(result).toEqual({
        type: 'flip',
        position: { row: 0, col: 0 },
        piece: { type: 'guard', color: 'red' },
      });

      randomSpy.mockRestore();
    });

    it('allows a player to reveal a piece of the opposite color', () => {
      const state = createBaseState({
        faceDownPieces: [{ type: 'guard', color: 'black' }],
      });
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.6);

      const move: NewMovePayload = {
        type: 'flip',
        position: { row: 0, col: 0 },
      };

      const result = validateMove({
        move,
        boardState: state,
        game: defaultGame,
        playerId: 'player-red',
      });

      if (result.type !== 'flip') {
        throw new Error('Expected validated flip move');
      }

      expect(result.piece).toEqual({ type: 'guard', color: 'black' });

      randomSpy.mockRestore();
    });

    it('rejects flipping when no face-down pieces remain', () => {
      const state = createBaseState({
        faceDownPieces: [],
      });

      const move: NewMovePayload = {
        type: 'flip',
        position: { row: 0, col: 0 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('No remaining face-down pieces to reveal'));
    });
  });

  describe('standard moves', () => {
    it('allows moving to an adjacent empty square', () => {
      const state = createBaseState();
      setPiece(state, { row: 0, col: 0 }, { type: 'guard', color: 'red' });
      setEmpty(state, { row: 0, col: 1 });

      const move: NewMovePayload = {
        type: 'move',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
      };

      const result = validateMove({
        move,
        boardState: state,
        game: defaultGame,
        playerId: 'player-red',
      });

      expect(result).toEqual(move);
    });

    it('rejects moving an opponent piece', () => {
      const state = createBaseState();
      setPiece(state, { row: 0, col: 0 }, { type: 'guard', color: 'black' });
      setEmpty(state, { row: 0, col: 1 });

      const move: NewMovePayload = {
        type: 'move',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('Cannot move an opponent piece', 403));
    });

    it('rejects non-adjacent moves', () => {
      const state = createBaseState();
      setPiece(state, { row: 0, col: 0 }, { type: 'guard', color: 'red' });
      setEmpty(state, { row: 0, col: 2 });

      const move: NewMovePayload = {
        type: 'move',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 2 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('Pieces move one square orthogonally'));
    });
  });

  describe('captures', () => {
    const setupCaptureState = (
      attacker: Piece,
      defender: Piece,
      attackerPos = { row: 0, col: 0 },
      defenderPos = { row: 0, col: 1 },
    ): BoardState => {
      const state = createBaseState();
      setPiece(state, attackerPos, attacker);
      setPiece(state, defenderPos, defender);
      return state;
    };

    it('allows capturing lower-ranked opponent pieces', () => {
      const state = setupCaptureState(
        { type: 'guard', color: 'red' },
        { type: 'horse', color: 'black' },
      );

      const move: NewMovePayload = {
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
      };

      const result = validateMove({
        move,
        boardState: state,
        game: defaultGame,
        playerId: 'player-red',
      });

      expect(result).toEqual({
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
        capturedPiece: { type: 'horse', color: 'black' },
      });
    });

    it('rejects capturing a higher-ranked piece without exception', () => {
      const state = setupCaptureState(
        { type: 'horse', color: 'red' },
        { type: 'king', color: 'black' },
      );

      const move: NewMovePayload = {
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('Attacking piece cannot capture the defender'));
    });

    it('enforces cannon jump rule', () => {
      const state = createBaseState();
      setPiece(state, { row: 0, col: 0 }, { type: 'cannon', color: 'red' });
      setPiece(state, { row: 0, col: 1 }, { type: 'guard', color: 'red' });
      setEmpty(state, { row: 0, col: 2 });
      setPiece(state, { row: 0, col: 3 }, { type: 'horse', color: 'black' });

      const move: NewMovePayload = {
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 3 },
      };

      const result = validateMove({
        move,
        boardState: state,
        game: defaultGame,
        playerId: 'player-red',
      });

      expect(result).toEqual({
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 3 },
        capturedPiece: { type: 'horse', color: 'black' },
      });
    });

    it('rejects cannon captures without exactly one intervening piece', () => {
      const state = createBaseState();
      setPiece(state, { row: 0, col: 0 }, { type: 'cannon', color: 'red' });
      setEmpty(state, { row: 0, col: 1 });
      setEmpty(state, { row: 0, col: 2 });
      setPiece(state, { row: 0, col: 3 }, { type: 'horse', color: 'black' });

      const move: NewMovePayload = {
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 3 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('Cannons must jump over exactly one piece to capture'));
    });

    it('rejects capturing along diagonal paths', () => {
      const state = setupCaptureState(
        { type: 'guard', color: 'red' },
        { type: 'horse', color: 'black' },
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      );

      const move: NewMovePayload = {
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('Pieces capture by moving one square orthogonally'));
    });

    it('prevents capturing your own piece', () => {
      const state = setupCaptureState(
        { type: 'guard', color: 'red' },
        { type: 'horse', color: 'red' },
      );

      const move: NewMovePayload = {
        type: 'capture',
        from: { row: 0, col: 0 },
        to: { row: 0, col: 1 },
      };

      expect(() =>
        validateMove({
          move,
          boardState: state,
          game: defaultGame,
          playerId: 'player-red',
        }),
      ).toThrow(new BanqiValidationError('Cannot capture your own piece'));
    });
  });
});

