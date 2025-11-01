# 4. Data Model

Our data will be stored in Google Firestore. The structure will consist of top-level collections for `users` and `games`. Each `game` document will contain a sub-collection for its `moves`.

## `users` collection

This collection will store user profile information. The document ID will be the user's UID from Firebase Auth.

```
/users/{userId}
```

*   **Document Data:**
    *   `displayName` (string)
    *   `email` (string)
    *   `wins` (number)
    *   `losses` (number)

## `games` collection

This collection will store metadata for each game.

```
/games/{gameId}
```

*   **Document Data:**
    *   `playerRedId` (string, foreign key to `users` collection)
    *   `playerBlackId` (string, foreign key to `users` collection)
    *   `status` (string: "waiting" | "in_progress" | "finished")
    *   `winner` (string: "red" | "black" | "draw") (optional)
    *   `createdAt` (timestamp)

### `moves` sub-collection

Each document in the `games` collection will have a `moves` sub-collection, which stores the ordered history of moves for that game.

```
/games/{gameId}/moves/{moveNumber}
```

*   **Document Data:**
    *   `piece` (string): The piece that was moved (e.g., "K", "P", "Q").
    *   `from` (string): The starting coordinate (e.g., "a1").
    *   `to` (string): The ending coordinate (e.g., "a2").
    *   `type` (string): The type of move (e.g., "flip", "move", "capture").
    *   `timestamp` (timestamp)
