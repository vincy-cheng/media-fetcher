# Media Fetcher – Agent Instructions

See [Copilot Instructions](.github/copilot-instructions.md) for architecture, commands, and conventions.

## Testing

Always test changes in all three modes for consistency:

- **Desktop**: IPC commands and sidecar interactions (progress, cancellation)
- **Web UI**: API endpoints and yt-dlp child process integration
- **CLI**: Command-line arguments and `YTDLP_BIN`/`FFMPEG_BIN` env var overrides

## Development Workflow

1. **Issue**: Create a GitHub issue describing the feature or bug.
2. **Branch**: Branch off `main` as `<type>/<issue-number>-<description>` (e.g. `feat/42-batch-download`).
3. **Spec**: Use `superpowers:brainstorm` to define scope in the issue.
4. **Plan**: Use `superpowers:writing-plans` to break work into tasks.
5. **Implement**: Follow project conventions; test in all three modes.
6. **Commit**: Use `caveman-commit` for commit messages. No co-authors.
7. **PR**: Open a PR linking the issue; request a code review.
