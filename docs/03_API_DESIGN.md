# 3. API Design

Given our decision to use Firestore for real-time data, we will not need a separate WebSocket API. All backend logic will be handled by stateless Next.js API Routes.

Authentication will be handled by the Firebase Auth client-side SDK, so we do not need dedicated registration or login endpoints in our API.

## Game API

*   **`POST /api/games`**
    *   Creates a new game.
    *   **Request Body:** `{ "opponent": "ai" | "human" }` (optional)
    *   **Response:** `{ "gameId": "..." }`

*   **`POST /api/games/{id}/moves`**
    *   Submits a new move to a game. The server will validate the move and, if valid, write it to the Firestore `moves` collection for that game.
    *   **Request Body:** `{ "ply": "GC2>GD2xpD2" }`. (See [Plies](https://github.com/arbrown/pao?tab=readme-ov-file#plies) in [Banqi Game Notation](https://github.com/perlmonger42/pao?tab=readme-ov-file#banqi-game-notation).)
    *   **Response:** `200 OK` or `400 Bad Request`

*   **`POST /api/games/{id}/forks`**
    *   Creates a new game forked from an existing game.
    *   **Request Body:** `{ "moveNumber": 42, "playerRedId": 19, "playerBlackId": 4 }` (The point to fork from)
    *   **Response:** `{ "newGameId": "..." }`

A "takeover" or "swap" is accomplished by a fork with the new red and black player assignments.

## Other APIs

*   **`GET /api/leaderboard`**
    *   Retrieves the player leaderboard.
    *   **Response:** `[{ "playerName": "...", "wins": 100, "losses": 50 }]`
