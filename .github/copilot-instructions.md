# Media Fetcher – Copilot Instructions

## Architecture

Three independent runtime modes share one React frontend (`client/`):

| Mode        | Entry point                     | Backend                          |
| ----------- | ------------------------------- | -------------------------------- |
| **Desktop** | `npm run dev` / `npm run build` | Rust (Tauri 2) in `src-tauri/`   |
| **Web UI**  | `npm run dev:web`               | Node.js/Express in `src/server/` |
| **CLI**     | `npm run cli`                   | Node.js in `src/cli/`            |

The shared business logic lives in two parallel implementations that must stay in sync:

- **Node.js** (`src/core/downloader.ts`) — used by CLI and web server via `child_process`
- **Rust** (`src-tauri/src/commands/`) — used by the desktop app via Tauri sidecar

**Types are duplicated** between `client/src/api/types.ts` (TypeScript) and `src-tauri/src/utils/types.rs` (Rust). When adding or changing a type, update both.

### Dual API Client (frontend)

The frontend uses a runtime-selected implementation of `IApiClient` (`client/src/api/IApiClient.ts`):

- `TauriApiClient` — wraps `invoke()`/`listen()`; all capabilities `true`
- `WebApiClient` — uses `fetch`/SSE + `localStorage`; capabilities: `canUpdate: false`, `canPreview: false`, `canBrowseFolder: false`

The factory in `client/src/api/client.ts` selects the implementation at module load via `window.__TAURI_INTERNALS__` detection. All hooks import from `@/api/client` — never directly from `@tauri-apps/api`.

**`Capabilities`** drives conditional UI: output folder picker, audio preview, and yt-dlp update UI are hidden in web mode.

### Desktop IPC flow

```
React (WebView)
  └── invoke("command_name", args)   → Rust #[tauri::command] fn
  └── listen("download-progress")   ← app.emit("download-progress", DownloadProgressEvent)
  └── listen("download-complete")   ← app.emit("download-complete", DownloadCompleteEvent)
```

All Rust commands are registered in `src-tauri/src/lib.rs` via `invoke_handler!(...)`. Adding a new command requires registering it there.

### Sidecar binaries

The desktop app bundles `yt-dlp` and `ffmpeg` as Tauri sidecars in `src-tauri/binaries/`. Binaries must be named with the Rust target triple suffix (e.g. `yt-dlp-aarch64-apple-darwin`). `scripts/download-binaries.sh` runs automatically on `npm install` via `postinstall`.

`run_ytdlp()` in `src-tauri/src/utils/sidecar.rs` checks `app_local_data_dir/yt-dlp` first and falls back to the bundled sidecar — this is the user-updatable override path.

In CLI/web mode, binaries are resolved by `resolveBin()` in `src/core/downloader.ts`: checks `YTDLP_BIN` / `FFMPEG_BIN` env vars → sidecar in `src-tauri/binaries/` → falls back to bare name for `PATH`.

### Job cancellation (desktop)

Each download gets a UUID `jobId`. A `tokio::sync::watch` channel is created per job and stored in `CancellationRegistry` (`Mutex<HashMap<String, watch::Sender<bool>>>`). Sending `true` cancels the running yt-dlp/ffmpeg process. The registry is managed in `src-tauri/src/lib.rs` (`.manage(...)`).

### Batch downloads

- Max 20 URLs (`MAX_BATCH_URLS = 20`)
- Max 3 concurrent downloads (`MAX_CONCURRENT_DOWNLOADS = 3`) via `runWithConcurrency` in `client/src/hooks/useBatchDownload.ts`
- Each item in the batch has its own `jobId` for independent progress tracking

---

## Commands

### Setup

```bash
npm install                  # installs deps + downloads sidecar binaries
npm install --prefix client  # install frontend deps
```

### Run

```bash
npm run dev        # desktop app (Tauri hot reload)
npm run dev:web    # Express :3001 + Vite :5173 (web mode)
npm run cli        # CLI (interactive if no args)
npm run setup      # re-download sidecar binaries
```

### Build

```bash
npm run build                          # Tauri production bundle
npm run build --prefix client          # frontend-only build
```

### Lint (frontend)

```bash
npm run lint --prefix client
```

### Rust tests

```bash
cargo test --manifest-path src-tauri/Cargo.toml          # all tests
cargo test --manifest-path src-tauri/Cargo.toml -- <name> # single test
```

---

## Key Conventions

### Rust ↔ TypeScript serialization

All Rust structs that cross the IPC boundary use `#[serde(rename_all = "camelCase")]`. Field names in Rust are `snake_case`; they become `camelCase` automatically when serialized to/from the frontend.

### Tauri event names

- `"download-progress"` — carries `DownloadProgressEvent` (includes `job_id`)
- `"download-complete"` — carries `DownloadCompleteEvent` (includes `job_id` and `output_path`)
- `"update_progress"` — carries `UpdateProgress` during yt-dlp self-update

### Temp file naming

yt-dlp downloads use the pattern `ytdl_dl_{job_id}.%(ext)s` in `std::env::temp_dir()`. After ffmpeg conversion the raw file is always deleted.

### Filename sanitization

Output filenames allow Unicode letters/digits (`\p{L}\p{N}`), spaces, hyphens, underscores, and dots; everything else becomes `_`. Rust uses `c.is_alphanumeric()` (Unicode-aware) in `sanitize_filename()`. Node.js uses `/[^\p{L}\p{N} \-_.]/gu` in `downloader.ts`. Both preserve CJK and other non-ASCII characters.

### Duration limits

Hard ceiling of 3 hours (`ABSOLUTE_MAX_DURATION_SECONDS = 10_800`) enforced in both Rust (`download.rs`) and TypeScript (`ABSOLUTE_MAX_DURATION_SECONDS` constant in `client/src/api/types.ts`). The user can set a lower limit via `AppSettings.downloadPreferences.maxDurationSeconds`.

### Cookie authentication

Handled via `CookieConfig { mode: "none" | "browser" | "file", ... }`. Browser names are allowlisted in `sanitize_browser()` (`src-tauri/src/utils/sidecar.rs`); unknown names fall back to `"chrome"`. File paths must be absolute and existing.

### yt-dlp format strings

- Audio: `"bestaudio"`
- Video: `"bestvideo[height<={height}]+bestaudio/best[height<={height}]"` where height comes from the resolution string (e.g. `"1080p"` → `1080`)

---

## Git Conventions

- **No co-authors with copilot** in any commit. Never add `Co-authored-by:` with copilot. Copilot is a tool, not a contributor.
- Commit messages follow Conventional Commits: `<type>(<scope>): <subject>`
- Branch format: `<type>/<issue-number>-<description>` (e.g. `feat/42-batch-download`)

---

## Git Workflow

- Branch strategy: `master` → `dev` → `feature/<name>`
- Submit PRs to `dev`; `master` is production-only.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <subject>`
  - Common types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
  - Breaking changes: append `!` or add `BREAKING CHANGE:` footer
  - use `caveman-commit` skill for auto-generating commit messages based on staged changes.

---

## Implementation Workflow

1. Create a GitHub Issue for the feature/bugfix. (Don't mention the spec document in the issue title as they are internal; just describe the feature/bug.)
2. Create a feature branch from `dev`: `git checkout -b feature/<issue-number>-<name>`
3. Implement the feature, following the architecture and code style guidelines.
4. Commit changes with conventional commit messages.
5. Push branch and create a PR to `dev`, referencing the issue (e.g. `Closes #<issue-number>`).
6. After PR approval, merge to `dev`.

### Plans and Specs

- Always add steps for issue, branch and PR creation in the plan document.
