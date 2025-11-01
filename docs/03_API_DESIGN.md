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
    *   **Request Body:** `{ "from": "a1", "to": "a2" }`
    *   **Response:** `200 OK` or `400 Bad Request`

*   **`POST /api/games/{id}/forks`**
    *   Creates a new game forked from an existing game.
    *   **Request Body:** `{ "moveNumber": 42 }` (The point to fork from)
    *   **Response:** `{ "newGameId": "..." }`

*   **`POST /api/games/{id}/takeovers`**
    *   Allows a player to take over a seat in a game (e.g., if a player disconnects and an AI or spectator takes their place).
    *   **Request Body:** `{ "seat": "red" | "black" }`
    *   **Response:** `200 OK` or `400 Bad Request`

## Other APIs

*   **`GET /api/leaderboard`**
    *   Retrieves the player leaderboard.
    *   **Response:** `[{ "playerName": "...", "wins": 100, "losses": 50 }]`
