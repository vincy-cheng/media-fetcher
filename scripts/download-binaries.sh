#!/usr/bin/env bash
# Downloads yt-dlp and ffmpeg into src-tauri/binaries/ for the current platform.
# Binaries are named with the Rust target triple suffix required by Tauri's externalBin.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARIES_DIR="$SCRIPT_DIR/../src-tauri/binaries"
mkdir -p "$BINARIES_DIR"
BINARIES_DIR="$(cd "$BINARIES_DIR" && pwd)"

# ── Detect Rust target triple ────────────────────────────────────────────────
PLATFORM="$(uname -s)"
ARCH="$(uname -m)"

case "${PLATFORM}-${ARCH}" in
  Darwin-arm64)  TRIPLE="aarch64-apple-darwin" ;;
  Darwin-x86_64) TRIPLE="x86_64-apple-darwin" ;;
  Linux-x86_64)  TRIPLE="x86_64-unknown-linux-gnu" ;;
  *)
    echo "Unsupported platform: ${PLATFORM}/${ARCH} — skipping binary download." >&2
    exit 0
    ;;
esac

echo "Platform triple: $TRIPLE"

# ── [1/2] yt-dlp ─────────────────────────────────────────────────────────────
YTDLP_DEST="$BINARIES_DIR/yt-dlp-$TRIPLE"

echo ""
echo "[1/2] yt-dlp"

if [ -f "$YTDLP_DEST" ]; then
  echo "  yt-dlp already exists, skipping."
else
  case "$TRIPLE" in
    *apple-darwin*) YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos" ;;
    *linux*)        YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" ;;
  esac
  echo "  Downloading $YTDLP_URL"
  curl -fL --progress-bar -o "$YTDLP_DEST" "$YTDLP_URL"
  chmod 755 "$YTDLP_DEST"
  echo "  yt-dlp saved to $YTDLP_DEST"
fi

# ── [2/2] ffmpeg ──────────────────────────────────────────────────────────────
FFMPEG_DEST="$BINARIES_DIR/ffmpeg-$TRIPLE"

echo ""
echo "[2/2] ffmpeg"

if [ -f "$FFMPEG_DEST" ]; then
  echo "  ffmpeg already exists, skipping."
else
  if [[ "$TRIPLE" == *apple-darwin* ]]; then
    brew install --quiet ffmpeg 2>/dev/null || true
    FFMPEG_SRC="$(brew --prefix ffmpeg)/bin/ffmpeg"
    cp "$FFMPEG_SRC" "$FFMPEG_DEST"
    chmod 755 "$FFMPEG_DEST"
  elif [[ "$TRIPLE" == *linux* ]]; then
    FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
    TAR_PATH="$BINARIES_DIR/ffmpeg.tar.xz"
    echo "  Downloading $FFMPEG_URL"
    curl -fL --progress-bar -o "$TAR_PATH" "$FFMPEG_URL"
    tar -xf "$TAR_PATH" -C "$BINARIES_DIR" --strip-components=1 --wildcards "*/ffmpeg"
    mv "$BINARIES_DIR/ffmpeg" "$FFMPEG_DEST"
    rm -f "$TAR_PATH"
    chmod 755 "$FFMPEG_DEST"
  fi
  echo "  ffmpeg saved to $FFMPEG_DEST"
fi



echo ""
echo "Done. Binaries are ready in src-tauri/binaries/"
