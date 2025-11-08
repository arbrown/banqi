# Banqi Game Rules

This document outlines the rules for the game of Banqi (also known as Half-Chess or Dark Chess), as implemented in this project. The rules are derived from the legacy Go implementation.

## 1. Objective

The objective of the game is to capture all of your opponent's pieces.

## 2. The Board

The game is played on a 4x8 grid (4 rows, 8 columns).

## 3. The Pieces

There are two colors: Red and Black. Each player has 16 pieces. The pieces are initially placed face-down on the board.

### Piece Notation

| Piece    | Red | Black | Rank |
| :------- | :-- | :---- | :--- |
| King     | k   | K     | 7    |
| General  | g   | G     | 6    |
| Elephant | e   | E     | 5    |
| Chariot  | c   | C     | 4    |
| Horse    | h   | H     | 3    |
| Pawn     | p   | P     | 2    |
| Cannon   | q   | Q     | 1    |

- **Unflipped Piece:** `?`
- **Empty Square:** `.`

### Piece Ranking and Capture Rules

- The rank of the pieces determines which pieces can capture which other pieces.
- A higher-ranking piece can capture a lower-ranking piece.
- Pieces of the same rank can capture each other.
- **Exception 1: The King and the Pawn**
  - The King (rank 7) is the highest-ranking piece, but it cannot capture a Pawn (rank 2).
  - A Pawn, however, can capture the King.
- **Exception 2: The Cannon**
  - The Cannon (rank 1) has a special capture rule (see below).

The capture hierarchy is as follows, represented by a `canAttack(attacker, defender)` matrix:

| Attacker | King | General | Elephant | Chariot | Horse | Pawn | Cannon |
| :--- | :--: | :-----: | :------: | :-----: | :---: | :---: | :----: |
| **King**     |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ❌    |   ✅   |
| **General**  |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ✅    |   ✅   |
| **Elephant** |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ✅    |   ✅   |
| **Chariot**  |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ✅    |   ✅   |
| **Horse**    |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ✅    |   ✅   |
| **Pawn**     |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ✅    |   ✅   |
| **Cannon**   |  ✅  |    ✅   |    ✅    |    ✅   |  ✅   |   ✅    |   ✅   |

*(Note: This table shows that most pieces can attack most other pieces. The primary restriction is that a lower-ranked piece cannot attack a higher-ranked piece, with the exceptions noted above.)*

A more precise representation of the attack logic is:
- A piece `A` can capture a piece `B` if `rank(A) >= rank(B)`, with the following exceptions:
  - If `A` is a Pawn and `B` is a King, `A` can capture `B`.
  - If `A` is a King and `B` is a Pawn, `A` cannot capture `B`.
- Cannons follow a different set of rules for movement and capture.

## 4. Gameplay

### Setup

All 32 pieces are randomly shuffled and placed face-down on the board.

### First Move

- The game begins with all pieces face-down (`?`).
- The first player to move can flip over any piece on the board.
- The color of this first flipped piece determines that player's color for the rest of the game. The other player is assigned the opposite color.

### Subsequent Moves

A player's turn consists of one of two actions:

1.  **Flip a Piece:** Turn over a face-down piece. This reveals the piece and it is now in play.
2.  **Move a Piece:** Move one of your face-up pieces to an adjacent square (up, down, left, or right).

### Capturing Pieces

- A player can capture an opponent's piece by moving one of their own pieces onto the square occupied by the opponent's piece.
- The capture must be a legal move according to the piece's rank (see Piece Ranking and Capture Rules).
- The captured piece is removed from the board.

### Cannon's Special Rule

- **Movement:** A Cannon moves like any other piece (one adjacent square) when it is not capturing.
- **Capturing:** A Cannon captures by "jumping" over exactly one other piece (of any color, face-up or face-down) in a straight line (horizontally or vertically). It lands on the square occupied by the opponent's piece, which is then captured. There can be any number of empty squares between the Cannon, the jumped piece, and the target piece.

## 5. Winning the Game

A player wins the game when their opponent has no legal moves left. This typically occurs when all of the opponent's pieces have been captured.

## 6. Stalemate

Players can agree to a stalemate, resulting in a draw. A player can propose a stalemate, and if the other player accepts, the game ends.
