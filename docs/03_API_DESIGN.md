# 3. API Design

Given our decision to use Firestore for real-time data, we will not need a separate WebSocket API. All backend logic will be handled by stateless Next.js API Routes.

Authentication will be handled by the Firebase Auth client-side SDK, so we do not need dedicated registration or login endpoints in our API.

## Game API

*   **`POST /api/games`**
    *   Creates a new game with the authenticated user as the first participant.
    *   **Response:** `{ "gameId": "..." }`

*   **`POST /api/games/{id}/players`**
    *   Adds the authenticated user to the game, provided there is still an open seat.
    *   **Response:** `{ "players": [{ "id": "...", "ready": false, "joinedAt": "..." }, ...] }`

*   **`PATCH /api/games/{id}/players`**
    *   Updates the caller’s ready state.
    *   **Request Body:** `{ "ready": true }`
    *   **Response:** `{ "players": [...] }`

*   **`POST /api/games/{id}/moves`**
    *   Submits a move. The first flip after two players join assigns colors and establishes turn order; subsequent moves enforce alternating turns.
    *   **Request Body:** One of:
        *   `{"type":"flip","position":{"row":0,"col":0}}`
        *   `{"type":"move","from":{"row":0,"col":0},"to":{"row":0,"col":1}}`
        *   `{"type":"capture","from":{"row":0,"col":0},"to":{"row":0,"col":1}}`
    *   **Response:** `{ "board": [...], "moves": [...] }`

## Other APIs

*   **`GET /api/leaderboard`**
    *   Retrieves the player leaderboard.
    *   **Response:** `[{ "playerName": "...", "wins": 100, "losses": 50 }]`
