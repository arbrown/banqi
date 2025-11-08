import { BANQI_COLUMNS, BANQI_ROWS, PIECE_COLORS } from './constants';
import {
  BoardCell,
  BoardPosition,
  BoardState,
  CaptureMove,
  FlipMove,
  Move,
  MoveMove,
  Piece,
  PieceColor,
  PieceType,
} from './types';

const makeUnknownCell = (): BoardCell => ({ kind: 'unknown' });
const makeEmptyCell = (): BoardCell => ({ kind: 'empty' });

const PIECE_COUNTS: Record<PieceType, number> = {
  king: 1,
  guard: 2,
  elephant: 2,
  cart: 2,
  horse: 2,
  pawn: 5,
  cannon: 2,
};

const createInitialPiecePool = (): Piece[] => {
  const pool: Piece[] = [];
  for (const color of PIECE_COLORS) {
    for (const type of Object.keys(PIECE_COUNTS) as PieceType[]) {
      const count = PIECE_COUNTS[type];
      for (let i = 0; i < count; i += 1) {
        pool.push({ type, color });
      }
    }
  }
  return pool;
};

const removePieceFromPool = (pool: Piece[], piece: Piece) => {
  const index = pool.findIndex(
    (candidate) => candidate.type === piece.type && candidate.color === piece.color,
  );

  if (index === -1) {
    throw new Error(`No remaining ${piece.color} ${piece.type} piece available to flip`);
  }

  pool.splice(index, 1);
};

export const createInitialBoard = (): BoardCell[][] =>
  Array.from({ length: BANQI_ROWS }, () =>
    Array.from({ length: BANQI_COLUMNS }, () => makeUnknownCell()),
  );

const cloneBoard = (board: BoardCell[][]): BoardCell[][] =>
  board.map((row) => row.map((cell) => (cell.kind === 'piece' ? { kind: 'piece', piece: { ...cell.piece } } : { ...cell })));

const assertWithinBounds = ({ row, col }: BoardPosition) => {
  if (row < 0 || row >= BANQI_ROWS || col < 0 || col >= BANQI_COLUMNS) {
    throw new Error(`Position out of bounds: row=${row}, col=${col}`);
  }
};

const applyFlipMove = (board: BoardCell[][], move: FlipMove) => {
  const { position, piece } = move;
  assertWithinBounds(position);
  const currentCell: BoardCell = board[position.row][position.col];
  if (currentCell.kind !== 'unknown') {
    throw new Error(`Cannot flip a cell that is already revealed or empty at row=${position.row}, col=${position.col}`);
  }
  board[position.row][position.col] = { kind: 'piece', piece: { ...piece } };
};

const applyMoveMove = (board: BoardCell[][], move: MoveMove) => {
  const { from, to } = move;
  assertWithinBounds(from);
  assertWithinBounds(to);

  const sourceCell: BoardCell = board[from.row][from.col];
  if (sourceCell.kind !== 'piece') {
    throw new Error(`Expected a revealed piece at row=${from.row}, col=${from.col}`);
  }

  const destinationCell: BoardCell = board[to.row][to.col];
  if (destinationCell.kind === 'piece') {
    throw new Error(`Cannot perform a non-capturing move onto an occupied square at row=${to.row}, col=${to.col}`);
  }
  if (destinationCell.kind === 'unknown') {
    throw new Error(`Cannot move onto an unrevealed square at row=${to.row}, col=${to.col}`);
  }

  board[from.row][from.col] = makeEmptyCell();
  board[to.row][to.col] = { kind: 'piece', piece: { ...sourceCell.piece } };
};

const applyCaptureMove = (board: BoardCell[][], move: CaptureMove, captures: Record<PieceColor, Piece[]>) => {
  const { from, to, capturedPiece } = move;
  assertWithinBounds(from);
  assertWithinBounds(to);

  const sourceCell: BoardCell = board[from.row][from.col];
  if (sourceCell.kind !== 'piece') {
    throw new Error(`Expected a revealed piece at row=${from.row}, col=${from.col}`);
  }

  const destinationCell: BoardCell = board[to.row][to.col];
  if (destinationCell.kind !== 'piece') {
    throw new Error(`Expected a revealed piece to capture at row=${to.row}, col=${to.col}`);
  }

  captures[sourceCell.piece.color].push({ ...capturedPiece });

  board[from.row][from.col] = makeEmptyCell();
  board[to.row][to.col] = { kind: 'piece', piece: { ...sourceCell.piece } };
};

export const reconstructBoardFromMoves = (moves: Move[]): BoardState => {
  const board = createInitialBoard();
  const captures: Record<PieceColor, Piece[]> = {
    red: [],
    black: [],
  };
  const remainingPieces = createInitialPiecePool();

  let lastMoveNumber = 0;

  for (const move of moves.sort((a, b) => a.moveNumber - b.moveNumber)) {
    lastMoveNumber = Math.max(lastMoveNumber, move.moveNumber);

    switch (move.type) {
      case 'flip':
        applyFlipMove(board, move as FlipMove);
        removePieceFromPool(remainingPieces, (move as FlipMove).piece);
        break;
      case 'move':
        applyMoveMove(board, move as MoveMove);
        break;
      case 'capture':
        applyCaptureMove(board, move as CaptureMove, captures);
        break;
      default:
        throw new Error(`Unsupported move type: ${(move as Move).type}`);
    }
  }

  return {
    board: cloneBoard(board),
    captures: {
      red: captures.red.map((piece) => ({ ...piece })),
      black: captures.black.map((piece) => ({ ...piece })),
    },
    lastMoveNumber,
    faceDownPieces: remainingPieces.map((piece) => ({ ...piece })),
  };
};

