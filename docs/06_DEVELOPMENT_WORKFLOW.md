# 6. Development Workflow & Conventions

## Coding Style

*   **Linting & Formatting:** We will use ESLint for code analysis and Prettier for code formatting. A pre-commit hook will be set up to automatically format files before they are committed.

## Git Workflow

*   **Branching:** We will follow the GitHub Flow.
    1.  Create a new branch from `main` for each new feature or bug fix.
    2.  Open a Pull Request (PR) to merge the branch back into `main`.
    3.  Require at least one code review and all automated checks to pass before merging.
*   **Commits:** Commits must follow the Conventional Commits specification. This will help in auto-generating changelogs.

## Testing

As defined in the Technical Stack document:
*   **Unit & Integration Tests:** Jest will be used for testing individual components and API routes.
*   **End-to-End Tests:** Playwright will be used to test full user flows in a browser environment.

## Directory Structure

We will use a monorepo structure to manage our code.

```
/
├── app/              # The main Next.js application
├── packages/         # Shared packages (e.g., game logic, UI components)
└── package.json
```