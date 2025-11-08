import type { GameDocument, GamePlayer, PieceColor } from './types';

const ensurePlayersInitialized = (game: GameDocument) => {
  if (!Array.isArray(game.players)) {
    game.players = [];
  }
};

export const findPlayer = (game: GameDocument, playerId: string): GamePlayer | undefined => {
  ensurePlayersInitialized(game);
  return game.players.find((player) => player.id === playerId);
};

export const addPlayerToGame = (game: GameDocument, playerId: string): boolean => {
  ensurePlayersInitialized(game);
  if (findPlayer(game, playerId)) {
    return false;
  }

  game.players.push({
    id: playerId,
    ready: false,
    joinedAt: new Date().toISOString(),
  });
  return true;
};

export const removePlayerFromGame = (game: GameDocument, playerId: string): boolean => {
  ensurePlayersInitialized(game);
  const initialLength = game.players.length;
  game.players = game.players.filter((player) => player.id !== playerId);
  if (game.playerRedId === playerId) {
    game.playerRedId = null;
  }
  if (game.playerBlackId === playerId) {
    game.playerBlackId = null;
  }
  if (game.firstPlayerId === playerId) {
    game.firstPlayerId = null;
  }
  if (game.currentTurn === playerId) {
    game.currentTurn = null;
  }
  return game.players.length < initialLength;
};

export const setPlayerReadyState = (
  game: GameDocument,
  playerId: string,
  ready: boolean,
): boolean => {
  const player = findPlayer(game, playerId);
  if (!player) {
    return false;
  }
  player.ready = ready;
  return true;
};

export const getOpponentId = (game: GameDocument, playerId: string): string | null => {
  ensurePlayersInitialized(game);
  const opponent = game.players.find((player) => player.id !== playerId);
  return opponent?.id ?? null;
};

export const hasTwoPlayers = (game: GameDocument): boolean => {
  ensurePlayersInitialized(game);
  return game.players.length >= 2;
};

export const assignColorsFromFirstFlip = (
  game: GameDocument,
  moverId: string,
  pieceColor: PieceColor,
): { playerRedId: string | null; playerBlackId: string | null } => {
  const opponentId = getOpponentId(game, moverId);
  if (pieceColor === 'red') {
    game.playerRedId = moverId;
    game.playerBlackId = opponentId;
  } else {
    game.playerBlackId = moverId;
    game.playerRedId = opponentId;
  }
  return {
    playerRedId: game.playerRedId ?? null,
    playerBlackId: game.playerBlackId ?? null,
  };
};

export const nextTurnFor = (game: GameDocument, playerId: string): string | null =>
  getOpponentId(game, playerId);

export const sanitizeGameDocument = (game: GameDocument): GameDocument => {
  ensurePlayersInitialized(game);
  return {
    players: game.players.map((player) => ({
      id: player.id,
      ready: Boolean(player.ready),
      joinedAt: player.joinedAt ?? new Date().toISOString(),
    })),
    playerRedId: game.playerRedId ?? null,
    playerBlackId: game.playerBlackId ?? null,
    firstPlayerId: game.firstPlayerId ?? null,
    currentTurn: game.currentTurn ?? null,
    status: game.status ?? 'waiting',
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    lastMoveNumber: game.lastMoveNumber,
    winner: game.winner ?? null,
  };
};

