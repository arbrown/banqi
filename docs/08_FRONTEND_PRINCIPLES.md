# 8. Frontend Principles

This document outlines the best practices and principles we will adhere to when developing the React frontend for the Pao rewrite.

### 1. Embrace Functional, Compositional React

*   **Functional Components & Hooks:** We will exclusively use functional components with Hooks (`useState`, `useEffect`, `useContext`, etc.). Class components will not be used.
*   **Composition over Inheritance:** We will build complex UIs by combining small, single-responsibility components. A `GamePage` component, for example, will be composed of `Board`, `Chat`, and `GameInfo` components.

### 2. Strong Separation of Concerns

*   **Isolate Backend Logic:** React components will not contain raw `fetch` calls or direct database queries. We will create a dedicated "API layer" (e.g., in `app/src/lib/api.ts`) that exposes functions like `createGame()` or `submitMove()`. Components will call these functions, remaining completely unaware of the backend implementation.
*   **Extract Logic into Custom Hooks:** Any non-trivial, reusable logic (like subscribing to game state from Firestore, managing form state, or tracking window size) will be extracted into a custom Hook (e.g., `useGameMoves(gameId)`). This keeps our components clean, declarative, and focused on rendering UI.
*   **"Smart" and "Dumb" Components:** We will differentiate between "smart" components (pages or containers) that fetch data and manage state, and "presentational" or "dumb" components that simply receive props and render UI.

### 3. Deliberate State Management

*   **Local First:** Start with local component state (`useState`).
*   **Lift State When Necessary:** If multiple components need to share state, we will lift it to their nearest common ancestor.
*   **Use Zustand for Global State:** For state that needs to be accessed across many different parts of the app (like the current user's authentication status), we will use Zustand. This provides a performant, low-boilerplate solution for global state.

### 4. Prioritize Performance from the Start

*   **Memoization:** We will use `React.memo`, `useCallback`, and `useMemo` where appropriate to prevent unnecessary re-renders, especially in the game loop.
*   **Leverage Next.js:** We will rely on Next.js's built-in performance optimizations like automatic code-splitting by page.

### 5. Emphasize Code Quality and Clarity

*   **TypeScript Everywhere:** We will use TypeScript to define clear types for all component props, state, and API data structures.
*   **Consistent Folder Structure:** We will agree on a logical folder structure (e.g., grouping by feature or page) to make code easy to find.