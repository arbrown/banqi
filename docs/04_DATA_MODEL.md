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
    *   `playerRedId` (string, foreign key to `users` collection)
    *   `playerBlackId` (string, foreign key to `users` collection)
    *   `status` (string: "waiting" | "in_progress" | "finished")
    *   `winner` (string: "red" | "black" | "draw") (optional)
    *   `createdAt` (timestamp)
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

#### Meta-Event Type: `takeover`
Indicates a player has taken over a seat from another player or an AI.
*   `seat` (string): "red" | "black"
*   `previousPlayerId` (string)
*   `newPlayerId` (string)

#### Meta-Event Type: `swap`
Indicates the players have swapped colors.
*   `playerRedId` (string): The ID of the user who is now Red.
*   `playerBlackId` (string): The ID of the user who is now Black.

#### Meta-Event Type: `draw`
Indicates the game has ended in a draw, either by agreement or rule.
*   `timestamp` (timestamp)

#### Meta-Event Type: `resign`
Indicates a player has resigned, ending the game.
*   `playerId` (string): The ID of the user who resigned.
