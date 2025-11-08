# 4. Data Model

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
    *   `players` (array): Ordered list of seated players. Each entry contains:
        *   `id` (string)
        *   `ready` (boolean)
        *   `joinedAt` (timestamp)
    *   `playerRedId` (string | null): Assigned after the first flip reveals a red piece.
    *   `playerBlackId` (string | null): Assigned after the first flip reveals a black piece.
    *   `firstPlayerId` (string | null): The player who made the first move.
    *   `currentTurn` (string | null): Which player is expected to act next once turns are enforced.
    *   `status` (string: "waiting" | "in_progress" | "finished")
    *   `winner` (string: "red" | "black" | "draw") (optional)
    *   `createdAt` / `updatedAt` (timestamps)
    *   `lastMoveNumber` (number)
    *   `forkInfo` (object, optional): Information about the game's origin if it was forked.
        *   `rootGameId` (string)
        *   `rootGameMoveNumber` (number)


### `moves` sub-collection

Each document in the `games` collection will have a `moves` sub-collection. This stores the ordered history of all moves and events that have occurred in the game.

```
/games/{gameId}/moves/{moveNumber}
```

*   **Document Data:**
    *   `type` (string): The type of action. Can be a piece move ("flip", "move", "capture") or a meta-event ("takeover", "swap", "draw", "resign").
    *   `timestamp` (timestamp)
    *   ...other fields depending on the `type`.

#### Move Types (`flip`, `move`, `capture`)
*   `piece` (string): The piece that was moved (e.g., "K", "P", "Q").
*   `from` (string): The starting coordinate (e.g., "a1").
*   `to` (string): The ending coordinate (e.g., "a2").

#### Meta-Event Type: `draw`
Indicates the game has ended in a draw, either by agreement or rule.
*   `timestamp` (timestamp)

#### Meta-Event Type: `resign`
Indicates a player has resigned, ending the game.
*   `playerId` (string): The ID of the user who resigned.
