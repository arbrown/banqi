# 2. Technical Stack & Architecture

## Frontend

*   **Framework:** Next.js (React)
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand
*   **Testing:** Playwright (for end-to-end tests)

## Backend

*   **Framework:** Next.js (API Routes)
*   **Database:** Google Firestore
*   **Authentication:** Firebase Auth
*   **Real-time Communication:** Firestore real-time updates
*   **Testing:** Jest (for unit/integration tests)

## Platform & Hosting

*   **Hosting:** Google Cloud Run (for the containerized Next.js application)
*   **Authentication Provider:** Firebase Authentication
*   **Database Provider:** Google Firestore

## Architecture

The application will be a monolithic full-stack application powered by Next.js.

*   **Frontend:** The user interface will be a single-page application (SPA) built with React and Next.js pages. Components will be styled with Tailwind CSS and manage shared state using Zustand.

*   **Backend:** The backend logic will reside in Next.js API Routes. These serverless functions will handle any non-real-time operations.

*   **Authentication:** User authentication will be managed by Firebase Auth. The Next.js frontend will interact with Firebase Auth to sign users in, and the backend API routes can verify user identity using Firebase's provided tokens.

*   **Database & Real-time:** Google Firestore will be the primary database. We will leverage its real-time capabilities for live gameplay.
    *   Game state will not be stored directly. Instead, each game will have a collection of "move" documents.
    *   The frontend will subscribe to a game's move collection in Firestore. As new moves are added, the client will receive them in real-time and reconstruct the current board state locally.
    *   This makes the backend inherently stateless, as the "source of truth" is the ordered list of moves in Firestore. This design naturally supports our goals for replays, spectating, and forking.
