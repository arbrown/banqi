# 5. Frontend Component Design

This document outlines the pages and component structure for the Next.js frontend.

## Pages

The application will have the following pages, managed by the Next.js file-based router:

*   `pages/index.tsx` -> **Lobby Page**
    *   Displays a list of active and available games.
    *   Allows users to create a new game.
*   `pages/games/[id].tsx` -> **Game Page**
    *   The main view for playing, spectating, or replaying a game.
*   `pages/leaderboard.tsx` -> **Leaderboard Page**
    *   Shows a ranked list of players.
*   `pages/login.tsx` -> **Login Page**
    *   Handles user authentication.

## Component Breakdown

### Lobby Page Components

*   `GameList`: Renders a list of games with their status.
*   `GameListItem`: A single item in the `GameList`.
*   `CreateGameButton`: A button that triggers the `POST /api/games` endpoint to start a new game.

### Game Page Components

*   `Board`: The main 4x8 game grid. It will listen to the game's `moves` collection in Firestore and reconstruct the board state. It will also handle user input for making moves.
*   `Piece`: Renders a single game piece.
*   `DeadPieces`: Displays the pieces that have been captured for each player.
*   `Chat`: A component for players to send and view messages (this will likely need its own Firestore collection).
*   `GameInfo`: Displays the current game state (whose turn, etc.).
*   `GameControls`: A container for buttons like "Fork Game", "Takeover Game", "Resign".

### Common Components

*   `Navbar`: The main site navigation bar.
*   `LoginButton`: A component that shows the user's status and allows them to log in/out using the Firebase Auth UI.
*   `LeaderboardTable`: The main table used on the leaderboard page.
