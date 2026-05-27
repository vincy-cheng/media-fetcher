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


## Development Guidelines

Follow the steps below when new features or bug fixes are being implemented:

1. **Create an Issue**: Before starting work, create an issue in the repository describing the feature or bug fix. This allows for better tracking and collaboration. 
2. **Branching**: Create a new branch from `main` for your work. Use a descriptive name for the branch and format in `<type>/<issue-number>-<description>` (e.g., `feat/add-batch-download` or `bugfix/fix-progress-tracking`).
3. **Specification**: Use the `superpowers:brainstorm` skill to clearly define the scope of the work in the issue description. Include any relevant details, such as expected behavior, edge cases, and any dependencies on other features or components.
4. **Planning**: Use the `superpowers:writing-plans` skill to create the plan for the implementation, breaking down the work into smaller tasks if necessary. This can be done in the issue description or as comments on the issue.
5. **Development**: Implement the feature or bug fix in your branch. Make sure to follow the project's coding standards and best practices. Test your changes locally in all three modes (desktop, web UI, CLI) to ensure consistency and functionality.
6. **Testing**: Write tests for your changes if applicable. This can include unit tests, integration tests, or end-to-end tests depending on the nature of the change. Ensure that all tests pass before proceeding to the next step.
7. **Code Review**: Code reviews before commiting.
8. **Commit Messages**: Use the `caveman-commit` skill to generate commit messages from the staged changes. This helps in maintaining a clear and consistent commit history.
9. **Pull Request**: Once your work is complete and tested, create a pull request (PR) to merge your branch into upper branches (e.g., `develop` or `main`). Link the PR to the corresponding issue for better traceability.
10. **Code Review**: Request a code review again on the PR. Address any feedback or requested changes from reviewers.
