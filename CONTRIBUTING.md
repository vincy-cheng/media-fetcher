# Contributing to Media Fetcher

Thank you for your interest in contributing to Media Fetcher! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/media-fetcher.git
   cd media-fetcher
   ```
3. **Create a feature branch** from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/<issue-number>-description
   ```

## Development Setup

```bash
npm install                  # Install dependencies + download sidecar binaries
npm install --prefix client  # Install frontend dependencies
```

## Running Locally

- **Desktop app** (Tauri): `npm run dev`
- **Web UI**: `npm run dev:web` (Express on :3001, Vite on :5173)
- **CLI**: `npm run cli`

## Before Submitting

1. **Test in all three modes** (desktop, web UI, CLI) for consistency
2. **Run validation**:
   ```bash
   npx tsc --noEmit
   npm run lint --prefix client
   npm run build --prefix client
   cargo test --manifest-path src-tauri/Cargo.toml
   ```
3. **Verify no secrets** are committed (credentials, tokens, API keys)

## Key Architecture Notes

- **Dual implementations**: Rust (Tauri desktop) and Node.js (CLI/web) must stay in sync
- **Types**: `client/src/api/types.ts` (TypeScript) and `src-tauri/src/utils/types.rs` (Rust) are duplicated intentionally
- **IPC flow**: Desktop app uses Tauri `invoke()` and `listen()` for Rust ↔ React communication
- **Sidecar binaries**: `yt-dlp` and `ffmpeg` are bundled; download with `npm install`

See `.github/copilot-instructions.md` for complete architecture details.

## Pull Request Process

1. **Link the issue**: Reference it in your PR description (`Closes #42`)
2. **Describe changes**: Explain what and why, not just what the code does
3. **Request review**: Tag relevant maintainers
4. **Respond to feedback**: Address comments constructively

## Issues & Feature Requests

- **Bug reports**: Include steps to reproduce, expected behavior, actual behavior
- **Feature requests**: Describe the use case and why it matters
- **Questions**: Use discussions or open an issue tagged `question`

## Need Help?

- Check existing issues and PRs for similar discussions
- Read `.github/copilot-instructions.md` for architecture details
- Open a discussion if unsure about implementation approach

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

---

Thanks for contributing! 🎉
