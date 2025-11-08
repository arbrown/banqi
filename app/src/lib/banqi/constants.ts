export const BANQI_ROWS = 4;
export const BANQI_COLUMNS = 8;

export const PIECE_TYPES = [
  'king',
  'guard',
  'elephant',
  'cart',
  'horse',
  'pawn',
  'cannon',
] as const;

export const PIECE_COLORS = ['red', 'black'] as const;

export const PIECE_COUNTS = {
  king: 1,
  guard: 2,
  elephant: 2,
  cart: 2,
  horse: 2,
  pawn: 5,
  cannon: 2,
} as const satisfies Record<(typeof PIECE_TYPES)[number], number>;

export const PIECE_RANK = {
  king: 7,
  guard: 6,
  elephant: 5,
  cart: 4,
  horse: 3,
  pawn: 2,
  cannon: 1,
} as const satisfies Record<(typeof PIECE_TYPES)[number], number>;

