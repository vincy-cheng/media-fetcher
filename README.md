# YouTube Audio Downloader

Download audio from YouTube in multiple formats with a native desktop app, web UI, or CLI.

Built with **Tauri 2** (Rust backend) + **React + Vite** (frontend).

---

## Features

- 🎵 Download audio as **mp3, m4a, wav, ogg, or flac**
- ✂️ **Visual waveform trim** — drag region handles or type start/end times
- 👁 **Audio preview** — WaveSurfer.js waveform before downloading
- 📁 **Native folder picker** — via Tauri dialog plugin
- 📋 **Live job queue** — progress per download
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
| `-f, --format` | `mp3` \| `m4a` \| `wav` \| `ogg` \| `flac` (default: prompted) |
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
- Platform-tagged sidecar binaries in `src-tauri/binaries/` (see [Sidecar Setup](#sidecar-setup))

---

## Setup

```bash
# Install all dependencies
npm install
npm install --prefix client
```

---

## Sidecar Setup (Desktop App Only)

Tauri bundles `yt-dlp` and `ffmpeg` as sidecars. Binaries must be named with the platform triple.

**macOS (Apple Silicon):**
```bash
mkdir -p src-tauri/binaries
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
  -o src-tauri/binaries/yt-dlp-aarch64-apple-darwin
chmod +x src-tauri/binaries/yt-dlp-aarch64-apple-darwin

# ffmpeg — download a static build and copy the binary:
# https://evermeet.cx/ffmpeg/
cp /path/to/ffmpeg src-tauri/binaries/ffmpeg-aarch64-apple-darwin
chmod +x src-tauri/binaries/ffmpeg-aarch64-apple-darwin
```

**macOS (Intel):** use `x86_64-apple-darwin` suffix
**Linux:** use `x86_64-unknown-linux-gnu` suffix
**Windows:** use `x86_64-pc-windows-msvc` suffix (add `.exe`)

The CLI and Web modes use `yt-dlp` and `ffmpeg` from your system `PATH` — no sidecar setup needed.

---

## Architecture

```
youtube-audio-downloader/
├── src-tauri/                  # Tauri Rust backend (desktop app)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── info.rs         # get_video_info — yt-dlp --dump-json
│   │   │   ├── preview.rs      # extract_preview_audio — temp file for WaveSurfer
│   │   │   └── download.rs     # download_audio — yt-dlp + ffmpeg + progress events
│   │   └── utils/
│   │       ├── sidecar.rs      # yt-dlp / ffmpeg sidecar helpers
│   │       ├── types.rs        # VideoInfo, JobProgress structs
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
│       │   ├── usePreview.ts   # convertFileSrc() for WaveSurfer
│       │   └── useDownloadJob.ts
│       └── components/
│           ├── UrlInput.tsx
│           ├── VideoInfoCard.tsx
│           ├── FormatSelector.tsx
│           ├── OutputFolder.tsx  # Tauri dialog plugin
│           ├── AudioPreview.tsx  # WaveSurfer + RegionsPlugin
│           ├── TrimControls.tsx
│           └── JobQueue.tsx
├── src/                        # Node.js backend (CLI + web mode)
│   ├── core/
│   │   ├── downloader.ts       # yt-dlp + ffmpeg via child_process
│   │   └── types.ts
│   ├── cli/
│   │   ├── index.ts            # commander entry point
│   │   └── prompts.ts          # inquirer prompts
│   └── server/
│       └── index.ts            # Express server (web mode)
└── package.json
```

### How the desktop app works

```
Rust (Tauri core)
  └── invoke("get_video_info", { url })   → runs yt-dlp --dump-json
  └── invoke("extract_preview_audio")    → yt-dlp → temp file → path returned
  └── invoke("download_audio", {...})    → yt-dlp → ffmpeg → emits progress events

React (WebView)
  └── @tauri-apps/api invoke()           → calls Rust commands
  └── @tauri-apps/api listen()           → receives "download-progress" events
  └── convertFileSrc(tempPath)           → safe URL for WaveSurfer
  └── @tauri-apps/plugin-dialog open()   → native folder picker
```

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Tauri desktop app (dev mode) |
| `npm run build` | Tauri production build |
| `npm run dev:web` | Web mode — Express `:3001` + Vite `:5173` |
| `npm run serve` | Express server only |
| `npm run cli` | CLI mode |

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
