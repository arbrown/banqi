/// <reference types="jest" />

import {
  addPlayerToGame,
  assignColorsFromFirstFlip,
  findPlayer,
  getOpponentId,
  hasTwoPlayers,
  nextTurnFor,
  sanitizeGameDocument,
  setPlayerReadyState,
} from '@/lib/banqi/game';
import type { GameDocument } from '@/lib/banqi/types';

const createGame = (overrides: Partial<GameDocument> = {}): GameDocument => {
  const base: GameDocument = {
    players: [],
    playerRedId: null,
    playerBlackId: null,
    firstPlayerId: null,
    currentTurn: null,
    status: 'waiting',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lastMoveNumber: 0,
    winner: null,
    ...overrides,
  };
  return sanitizeGameDocument(base);
};

describe('banqi/game helpers', () => {
  it('adds players and prevents duplicates', () => {
    const game = createGame();
    expect(addPlayerToGame(game, 'player-one')).toBe(true);
    expect(addPlayerToGame(game, 'player-one')).toBe(false);
    expect(findPlayer(game, 'player-one')).toBeDefined();
  });

  it('tracks opponent and turn rotation', () => {
    const game = createGame();
    addPlayerToGame(game, 'player-one');
    addPlayerToGame(game, 'player-two');

    expect(hasTwoPlayers(game)).toBe(true);
    expect(getOpponentId(game, 'player-one')).toBe('player-two');
    expect(nextTurnFor(game, 'player-one')).toBe('player-two');
  });

  it('assigns colors based on the first flip', () => {
    const game = createGame();
    addPlayerToGame(game, 'player-one');
    addPlayerToGame(game, 'player-two');

    const { playerRedId, playerBlackId } = assignColorsFromFirstFlip(game, 'player-one', 'red');
    expect(playerRedId).toBe('player-one');
    expect(playerBlackId).toBe('player-two');

    const flipBlack = assignColorsFromFirstFlip(game, 'player-two', 'black');
    expect(flipBlack.playerBlackId).toBe('player-two');
    expect(flipBlack.playerRedId).toBe('player-one');
  });

  it('updates ready state for participants', () => {
    const game = createGame();
    addPlayerToGame(game, 'player-one');
    addPlayerToGame(game, 'player-two');

    expect(setPlayerReadyState(game, 'player-one', true)).toBe(true);
    expect(findPlayer(game, 'player-one')?.ready).toBe(true);
    expect(setPlayerReadyState(game, 'unknown', true)).toBe(false);
  });
});

