import { BANQI_COLUMNS, BANQI_ROWS, PIECE_COLORS, PIECE_TYPES } from './constants';

export type PieceType = (typeof PIECE_TYPES)[number];
export type PieceColor = (typeof PIECE_COLORS)[number];

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface BoardPosition {
  row: number;
  col: number;
}

export type MoveType = 'flip' | 'move' | 'capture';

export interface MoveBase {
  id?: string;
  moveNumber: number;
  playerId: string;
  createdAt: string | null;
  type: MoveType;
}

export interface FlipMove extends MoveBase {
  type: 'flip';
  position: BoardPosition;
  piece: Piece;
}

export interface MoveMove extends MoveBase {
  type: 'move';
  from: BoardPosition;
  to: BoardPosition;
}

export interface CaptureMove extends MoveBase {
  type: 'capture';
  from: BoardPosition;
  to: BoardPosition;
  capturedPiece: Piece;
}

export type Move = FlipMove | MoveMove | CaptureMove;

export type BoardCell =
  | { kind: 'unknown' }
  | { kind: 'empty' }
  | { kind: 'piece'; piece: Piece };

export interface BoardState {
  board: BoardCell[][];
  captures: {
    red: Piece[];
    black: Piece[];
  };
  lastMoveNumber: number;
  faceDownPieces: Piece[];
}

export type NewMovePayload =
  | {
      type: 'flip';
      position: BoardPosition;
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
    };

export interface GamePlayer {
  id: string;
  ready: boolean;
  joinedAt: string;
}

export interface GameDocument {
  players: GamePlayer[];
  playerRedId: string | null;
  playerBlackId: string | null;
  firstPlayerId: string | null;
  currentTurn: string | null;
  status: 'waiting' | 'in_progress' | 'finished';
  createdAt?: string;
  updatedAt?: string;
  lastMoveNumber?: number;
  winner?: string | null;
}

export type SeatColor = 'red' | 'black';

export type ValidatedMove =
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

export const isWithinBoard = ({ row, col }: BoardPosition): boolean =>
  row >= 0 && row < BANQI_ROWS && col >= 0 && col < BANQI_COLUMNS;

