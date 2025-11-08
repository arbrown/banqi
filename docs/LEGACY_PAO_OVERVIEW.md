# Pao Game Overview

This document provides an overview of the Pao (Ban Qi) game project, including its gameplay, frontend and backend architecture, and other technical details.

## Game

Ban Qi is a Chinese chess variant played on a 4x8 board. The game is for two players, Red and Black.

### Game Rules

*   **Board:** The game is played on a 4x8 grid.
*   **Pieces:** There are 32 pieces in total, with each player having 16. The pieces are initially placed face down on the board.
*   **Flipping:** The first move of the game is to flip a piece. The color of the first flipped piece determines the color of the player who flipped it.
*   **Turns:** Players take turns moving their pieces.
*   **Movement:**
    *   Most pieces move one square horizontally or vertically.
    *   The Cannon moves differently when capturing.
*   **Capturing:**
    *   A piece can capture an opponent's piece if the capturing piece has a higher or equal rank.
    *   The King can capture the Pawn, but the Pawn can capture the King.
    *   The Cannon captures by jumping over a single piece (of any color) in a straight line to land on an opponent's piece.
*   **Winning:** A player wins when the opponent has no legal moves left.

### Pieces

The pieces are ranked as follows, from highest to lowest:

1.  **King (K/k)**
2.  **Guard (G/g)**
3.  **Elephant (E/e)**
4.  **Cart (C/c)**
5.  **Horse (H/h)**
6.  **Pawn (P/p)**
7.  **Cannon (Q/q)**

Each player has:
*   1 King
*   2 Guards
*   2 Elephants
*   2 Carts
*   2 Horses
*   5 Pawns
*   2 Cannons

## Frontend

The frontend is a React application.

*   **Framework:** React
*   **Styling:** CSS with class names that suggest a BEM-like methodology.
*   **Components:** The application is broken down into several components:
    *   `Lobby`: Displays a list of available games and allows players to join or create a new game.
    *   `Game`: The main game interface, which includes the board, dead pieces, and chat.
    *   `Board`: Renders the game board and handles piece movement.
    *   `Dead`: Displays the captured pieces.
    *   `Chat`: A chat window for players to communicate.
    *   `Login`: A simple login and registration form.
    *   `LeaderBoard`: Shows a leaderboard of player wins.
*   **Features:**
    *   Game lobby with a list of current games.
    *   Real-time gameplay with WebSocket communication.
    *   Chat functionality.
    *   A leaderboard.
    *   Player authentication.
    *   A reconnection feature that allows players to rejoin a game if they get disconnected.

## Backend

The backend is written in Go.

*   **Language:** Go
*   **Communication:** WebSockets are used for real-time communication between the server and clients.
*   **Game Logic:** The `game` package contains the core game logic, including game state management, move validation, and player handling.
*   **Database:** The application uses a database (likely PostgreSQL, based on the `go.mod` file) for:
    *   Player authentication (`db/auth.go`).
    *   Storing game statistics and leaderboards (`db/stats.go`).
*   **AI:** There is a simple AI opponent (`ai/flippy/flippy.go`).
*   **Configuration:** The application is configured via a JSON file (`conf/paoSettings.json.sample`).

## Other Technical Decisions

*   **Libraries:**
    *   **Go:** `gorilla/websocket` for WebSocket communication, `apexskier/httpauth` for authentication.
    *   **React:** `react-scripts` (Create React App), `http-proxy-middleware`.
*   **Deployment:** The project includes a `Dockerfile` and a `cloudbuild.yaml` file, suggesting it is set up for containerization and deployment on Google Cloud Platform.
*   **Services:** There are `.service` files for `pao` and `flippy`, which are likely for running the application and the AI as systemd services.
