# 7. Roadmap & Milestones

## Milestone 1: Project Setup & Backend Foundation

*   [x] Initialize the monorepo with the `app` Next.js workspace and shared tooling.
*   [x] Configure Firebase client and admin SDKs (Auth + Firestore) for local and deployed environments.
*   [x] Implement Firebase Auth flows (Google sign-in and guest) with Zustand-backed user state.
*   [x] Create authenticated `POST /api/games` API route that persists new games to Firestore.
*   [ ] Harden Firestore security rules and expand local emulator coverage.

## Milestone 2: Core Game Logic

*   [x] Persist Banqi game state by recording moves in `games/{id}/moves` and reconstructing board state.
*   [x] Implement move validation and rule enforcement service.
*   [x] Add player seat management (join, readiness, first-move color assignment) backed by Firestore.
*   [ ] Subscribe to Firestore real-time updates for active games in both client and server contexts.

## Milestone 3: Frontend Implementation

*   [x] Scaffold Next.js App Router layout, global styles, and authenticated home screen.
*   [ ] Implement game lobby UI (list available games, join seats).
*   [ ] Build interactive game board UI with piece interactions and move feedback.
*   [ ] Integrate client-side listeners for real-time game updates.

## Milestone 4: Additional Features & Polish

*   [ ] Implement chat functionality.
*   [ ] Implement leaderboard.
*   [ ] Implement AI opponent.
*   [ ] Polish UI and improve user experience.

## Milestone 5: Deployment

*   [ ] Containerize the application using Docker.
*   [ ] Set up CI/CD pipeline.
*   [ ] Deploy to a cloud provider.
