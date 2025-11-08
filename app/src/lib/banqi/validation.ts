import { PIECE_RANK } from './constants';
import type {
  BoardCell,
  BoardPosition,
  BoardState,
  GameDocument,
  NewMovePayload,
  Piece,
  PieceColor,
  ValidatedMove,
} from './types';

export class BanqiValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ValidateMoveParams {
  move: NewMovePayload;
  boardState: BoardState;
  game: GameDocument;
  playerId: string;
}

const getPlayerColorForUser = (game: GameDocument, playerId: string): PieceColor | null => {
  if (game.playerRedId === playerId) {
    return 'red';
  }
  if (game.playerBlackId === playerId) {
    return 'black';
  }
  return null;
};

const ensurePlayerColor = (game: GameDocument, playerId: string): PieceColor => {
  const color = getPlayerColorForUser(game, playerId);
  if (!color) {
    throw new BanqiValidationError('Player is not seated in this game', 403);
  }
  return color;
};

const isOrthogonallyAdjacent = (from: BoardPosition, to: BoardPosition): boolean =>
  Math.abs(from.row - to.row) + Math.abs(from.col - to.col) === 1;

const isSameRowOrColumn = (from: BoardPosition, to: BoardPosition): boolean =>
  from.row === to.row || from.col === to.col;

const countPiecesBetween = (board: BoardCell[][], from: BoardPosition, to: BoardPosition): number => {
  if (!isSameRowOrColumn(from, to)) {
    throw new BanqiValidationError('Cannons capture along ranks or files only');
  }

  let count = 0;
  if (from.row === to.row) {
    const row = from.row;
    const [start, end] = from.col < to.col ? [from.col, to.col] : [to.col, from.col];
    for (let col = start + 1; col < end; col += 1) {
      const cell = board[row][col];
      if (cell.kind === 'piece' || cell.kind === 'unknown') {
        count += 1;
      }
    }
  } else {
    const col = from.col;
    const [start, end] = from.row < to.row ? [from.row, to.row] : [to.row, from.row];
    for (let row = start + 1; row < end; row += 1) {
      const cell = board[row][col];
      if (cell.kind === 'piece' || cell.kind === 'unknown') {
        count += 1;
      }
    }
  }

  return count;
};

const canCapture = (attacker: Piece, defender: Piece): boolean => {
  if (attacker.type === 'cannon') {
    return true;
  }
  if (attacker.type === 'pawn' && defender.type === 'king') {
    return true;
  }
  if (attacker.type === 'king' && defender.type === 'pawn') {
    return false;
  }
  return PIECE_RANK[attacker.type] >= PIECE_RANK[defender.type];
};

const drawRandomFaceDownPiece = (pieces: Piece[]): Piece => {
  if (!pieces.length) {
    throw new BanqiValidationError('No remaining face-down pieces to reveal');
  }
  const index = Math.floor(Math.random() * pieces.length);
  return pieces[index];
};

const validateFlipMove = (boardState: BoardState, move: Extract<NewMovePayload, { type: 'flip' }>): ValidatedMove => {
  const { position } = move;
  const cell = boardState.board[position.row][position.col];
  if (cell.kind !== 'unknown') {
    throw new BanqiValidationError('Only face-down pieces can be flipped');
  }

  const piece = drawRandomFaceDownPiece(boardState.faceDownPieces);

  return {
    type: 'flip',
    position,
    piece: { ...piece },
  };
};

const validateMoveMove = (
  boardState: BoardState,
  game: GameDocument,
  playerId: string,
  move: Extract<NewMovePayload, { type: 'move' }>,
): ValidatedMove => {
  const playerColor = ensurePlayerColor(game, playerId);
  const { from, to } = move;

  const sourceCell: BoardCell = boardState.board[from.row][from.col];
  if (sourceCell.kind !== 'piece') {
    throw new BanqiValidationError('No revealed piece at the source square');
  }
  if (sourceCell.piece.color !== playerColor) {
    throw new BanqiValidationError('Cannot move an opponent piece', 403);
  }

  const destinationCell: BoardCell = boardState.board[to.row][to.col];
  if (destinationCell.kind === 'piece') {
    throw new BanqiValidationError('Destination square is occupied');
  }
  if (destinationCell.kind === 'unknown') {
    throw new BanqiValidationError('Cannot move onto an unrevealed square');
  }

  if (!isOrthogonallyAdjacent(from, to)) {
    throw new BanqiValidationError('Pieces move one square orthogonally');
  }

  if (sourceCell.piece.type === 'cannon') {
    // Cannons move like other pieces when not capturing.
    // No additional validation required beyond adjacency.
  }

  return move;
};

const validateCaptureMove = (
  boardState: BoardState,
  game: GameDocument,
  playerId: string,
  move: Extract<NewMovePayload, { type: 'capture' }>,
): ValidatedMove => {
  const playerColor = ensurePlayerColor(game, playerId);
  const { from, to } = move;

  const sourceCell: BoardCell = boardState.board[from.row][from.col];
  if (sourceCell.kind !== 'piece') {
    throw new BanqiValidationError('No revealed piece at the source square');
  }
  if (sourceCell.piece.color !== playerColor) {
    throw new BanqiValidationError('Cannot move an opponent piece', 403);
  }

  const destinationCell: BoardCell = boardState.board[to.row][to.col];
  if (destinationCell.kind !== 'piece') {
    throw new BanqiValidationError('No revealed opponent piece to capture');
  }
  if (destinationCell.piece.color === playerColor) {
    throw new BanqiValidationError('Cannot capture your own piece');
  }

  if (sourceCell.piece.type === 'cannon') {
    if (!isSameRowOrColumn(from, to)) {
      throw new BanqiValidationError('Cannons capture along ranks or files only');
    }
    const intervening = countPiecesBetween(boardState.board, from, to);
    if (intervening !== 1) {
      throw new BanqiValidationError('Cannons must jump over exactly one piece to capture');
    }
  } else {
    if (!isOrthogonallyAdjacent(from, to)) {
      throw new BanqiValidationError('Pieces capture by moving one square orthogonally');
    }
  }

  if (!canCapture(sourceCell.piece, destinationCell.piece)) {
    throw new BanqiValidationError('Attacking piece cannot capture the defender');
  }

  return {
    type: 'capture',
    from,
    to,
    capturedPiece: { ...destinationCell.piece },
  };
};

export const validateMove = ({ move, boardState, game, playerId }: ValidateMoveParams): ValidatedMove => {
  switch (move.type) {
    case 'flip':
      return validateFlipMove(boardState, move);
    case 'move':
      return validateMoveMove(boardState, game, playerId, move);
    case 'capture':
      return validateCaptureMove(boardState, game, playerId, move);
    default:
      throw new BanqiValidationError('Unsupported move type');
  }
};

