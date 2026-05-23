# Media Fetcher – Agent Instructions

This file provides instructions for agents working on the Media Fetcher project. It covers background information, testing guidelines, and git control practices to ensure smooth development and collaboration.

## Background

- Always refer to the [Copilot Instructions](.github/copilot-instructions.md) and the [README](README.md) for architecture and setup details.
- The desktop app uses Tauri 2 with Rust for the backend, while the web UI and CLI use Node.js. Business logic is duplicated in both languages and must be kept in sync.

## Testing

- Always test new features and bug fixes in all three modes (desktop, web UI, CLI) to ensure consistency.
- Use the provided npm scripts for running each mode:

```bash
npm run dev        # desktop app (Tauri hot reload)
npm run dev:web    # web UI (Node.js/Express)
npm run cli        # CLI (Node.js)
```

- For desktop mode, test IPC commands and sidecar interactions thoroughly, especially for download progress and cancellation.
- For web UI, test API endpoints and ensure the child process integration with yt-dlp works correctly.
- For CLI, test command-line arguments and environment variable overrides for yt-dlp and ff

### Git Control

- Use feature branches for new features and bug fixes.
- use skill `caveman-commit` to generate commit messages from the staged changes.
- All commits will be manually reviewed and committed after feature completion to ensure clean commit history and proper documentation.

## Issue first approach

- Always create an issue before starting work on a new feature or bug fix. This helps in tracking progress and allows for better collaboration and feedback.
- Link pull requests to their corresponding issues for better traceability.