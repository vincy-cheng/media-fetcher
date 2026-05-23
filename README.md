# Media Fetcher

Download audio or video from YouTube in multiple formats with a native desktop app, web UI, or CLI.

Built with **Tauri 2** (Rust backend) + **React + Vite** (frontend).

---

## Features

- 🎵 Download audio as **mp3, m4a, wav, ogg, or flac**
- 🎬 Download video as **mp4 or webm** with selectable resolution (360p–2160p)
- 📦 **Batch download** — queue up to 20 URLs, downloads 3 at a time
- ✂️ **Visual waveform trim** — drag region handles or type start/end times
- 👁 **Audio preview** — WaveSurfer.js waveform before downloading
- 📁 **Native folder picker** — via Tauri dialog plugin
- 📋 **Live job queue** — per-download progress tracking
- ⚙️ **Persistent settings** — default format, bitrate, and output folder saved to app config
- 🌙 **Dark mode**
- 🖥 **Three modes** — Desktop app, Web UI, or CLI

---

## Modes

### Desktop App (Tauri)

Native ~15 MB app. No browser required.

```bash
npm run dev       # dev mode (hot reload)
npm run build     # production build → src-tauri/target/release/bundle/
```

### Web UI

Browser-based. Requires Express server + Vite dev server.

```bash
npm run dev:web   # starts Express on :3001 + Vite on :5173
```

Then open `http://localhost:5173`.

### CLI

```bash
# Single URL
npm run cli -- https://www.youtube.com/watch?v=XXXXXXXXXXX

# With options
npm run cli -- https://youtu.be/XXXXXXXXXXX --format mp3 --output ~/Downloads

# Trim
npm run cli -- https://youtu.be/XXXXXXXXXXX --start 0:30 --end 2:45 --format flac

# Interactive (no args — prompts for everything)
npm run cli
```

**CLI flags:**

| Flag | Description |
|---|---|
| `-f, --format` | `mp3` \| `m4a` \| `wav` \| `ogg` \| `flac` \| `mp4` \| `webm` (default: prompted) |
| `-r, --resolution` | `360p` \| `480p` \| `720p` \| `1080p` \| `1440p` \| `2160p` — video only (default: `1080p`) |
| `-s, --start` | Trim start time `HH:MM:SS` or `MM:SS` |
| `-e, --end` | Trim end time `HH:MM:SS` or `MM:SS` |
| `-o, --output` | Output directory path (default: prompted) |

---

## Requirements

### All modes
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — YouTube downloader
- **[ffmpeg](https://ffmpeg.org/)** — Audio conversion

Install on macOS:
```bash
brew install yt-dlp ffmpeg
```

### Desktop app (Tauri) — additional
- **Rust** toolchain: `rustup update stable`
- **Xcode license** accepted: `sudo xcodebuild -license accept`

---

## Setup

```bash
# Install all dependencies (also downloads sidecar binaries for the desktop app)
npm install
npm install --prefix client
```

`npm install` runs `scripts/download-binaries.sh` automatically via `postinstall`. It detects your platform, downloads the correct `yt-dlp` and `ffmpeg` builds, and places them in `src-tauri/binaries/` with the required Rust target triple suffix.

> **Manual sidecar setup** (if the script fails): see [Sidecar Setup](#sidecar-setup-manual).

The CLI and Web modes use `yt-dlp` and `ffmpeg` from your system `PATH` — no sidecar setup needed.

---

## Architecture

```
media-fetcher/
├── src-tauri/                  # Tauri Rust backend (desktop app)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── info.rs         # get_video_info — yt-dlp --dump-json
│   │   │   ├── preview.rs      # extract_preview_audio — temp file for WaveSurfer
│   │   │   ├── download.rs     # download_audio — yt-dlp + ffmpeg + progress events
│   │   │   └── settings.rs     # get_settings / save_settings — app config dir JSON
│   │   └── utils/
│   │       ├── sidecar.rs      # yt-dlp / ffmpeg sidecar helpers
│   │       ├── types.rs        # VideoInfo, JobProgress, AppSettings structs
│   │       └── validation.rs   # YouTube URL validation
│   ├── binaries/               # Platform-tagged sidecar binaries (git-ignored)
│   └── tauri.conf.json
├── client/                     # React + Vite frontend (shared by desktop + web)
│   └── src/
│       ├── api/
│       │   ├── client.ts       # invoke() / listen() wrappers
│       │   └── types.ts        # Shared TS types
│       ├── hooks/
│       │   ├── useVideoInfo.ts
│       │   ├── usePreview.ts      # convertFileSrc() for WaveSurfer
│       │   ├── useDownloadJob.ts
│       │   ├── useBatchDownload.ts  # batch queue + concurrent download logic
│       │   ├── useSettings.ts     # load/save persistent settings via Rust
│       │   └── useDarkMode.ts
│       └── components/
│           ├── UrlInput.tsx
│           ├── VideoInfoCard.tsx
│           ├── FormatSelector.tsx
│           ├── OutputFolder.tsx      # Tauri dialog plugin
│           ├── AudioPreview.tsx      # WaveSurfer + RegionsPlugin
│           ├── TrimControls.tsx
│           ├── JobQueue.tsx
│           ├── BatchDownload.tsx     # batch tab UI
│           ├── BatchUrlInput.tsx
│           ├── BatchItemRow.tsx
│           └── SettingsModal.tsx
├── src/                        # Node.js backend (CLI + web mode)
│   ├── core/
│   │   ├── downloader.ts       # yt-dlp + ffmpeg via child_process
│   │   └── types.ts
│   ├── cli/
│   │   ├── index.ts            # commander entry point
│   │   └── prompts.ts          # inquirer prompts
│   └── server/
│       └── index.ts            # Express server (web mode)
└── scripts/
    └── download-binaries.sh    # auto-downloads sidecar binaries on npm install
```

### How the desktop app works

```
Rust (Tauri core)
  └── invoke("get_video_info", { url })    → yt-dlp --dump-json
  └── invoke("extract_preview_audio")     → yt-dlp → temp file → path returned
  └── invoke("download_audio", {...})     → yt-dlp → ffmpeg → emits progress events
  └── invoke("get_settings")             → reads app config dir / settings.json
  └── invoke("save_settings", {...})     → writes app config dir / settings.json

React (WebView)
  └── @tauri-apps/api invoke()            → calls Rust commands
  └── @tauri-apps/api listen()            → receives "download-progress" / "download-complete" events
  └── convertFileSrc(tempPath)            → safe URL for WaveSurfer
  └── @tauri-apps/plugin-dialog open()    → native folder picker
```

### Batch download

- Up to **20 URLs** queued (`MAX_BATCH_URLS = 20`)
- Video info fetched in parallel as URLs are added
- Downloads run with **3 concurrent workers** (`MAX_CONCURRENT_DOWNLOADS = 3`) via `runWithConcurrency` in `useBatchDownload.ts`
- Each item uses its own `jobId` (UUID) for progress tracking via Tauri events

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Tauri desktop app (dev mode) |
| `npm run build` | Tauri production build |
| `npm run dev:web` | Web mode — Express `:3001` + Vite `:5173` |
| `npm run serve` | Express server only |
| `npm run cli` | CLI mode |
| `npm run setup` | Re-run sidecar binary download script |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| YouTube download | yt-dlp (sidecar / system) |
| Audio conversion | ffmpeg (sidecar / system) |
| Frontend framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Waveform | WaveSurfer.js + RegionsPlugin |
| Native dialogs | @tauri-apps/plugin-dialog |
| IPC | @tauri-apps/api invoke / listen |
| Web server (optional) | Express |
| CLI | commander + inquirer + ora |

---

## Sidecar Setup (Manual)

If `npm install` fails to download the sidecar binaries, you can set them up manually. Binaries must be named with the Rust target triple suffix.

**macOS (Apple Silicon):**
```bash
mkdir -p src-tauri/binaries

# yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
  -o src-tauri/binaries/yt-dlp-aarch64-apple-darwin
chmod +x src-tauri/binaries/yt-dlp-aarch64-apple-darwin

# ffmpeg — copy from Homebrew
cp "$(brew --prefix ffmpeg)/bin/ffmpeg" src-tauri/binaries/ffmpeg-aarch64-apple-darwin
chmod +x src-tauri/binaries/ffmpeg-aarch64-apple-darwin
```

| Platform | Triple suffix |
|---|---|
| macOS Apple Silicon | `aarch64-apple-darwin` |
| macOS Intel | `x86_64-apple-darwin` |
| Linux x86_64 | `x86_64-unknown-linux-gnu` |
| Windows x86_64 | `x86_64-pc-windows-msvc` (add `.exe`) |
