#!/usr/bin/env bash
# Downloads yt-dlp and ffmpeg into src-tauri/binaries/ for the current platform.
# Binaries are named with the Rust target triple suffix required by Tauri's externalBin.
#
# Usage: download-binaries.sh [TARGET_TRIPLE]
#   TARGET_TRIPLE  Optional. Override the detected host triple (e.g. for CI cross-compilation).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARIES_DIR="$SCRIPT_DIR/../src-tauri/binaries"
mkdir -p "$BINARIES_DIR"
BINARIES_DIR="$(cd "$BINARIES_DIR" && pwd)"

# ── Detect host triple ────────────────────────────────────────────────────────
PLATFORM="$(uname -s)"
ARCH="$(uname -m)"

case "${PLATFORM}-${ARCH}" in
  Darwin-arm64)   HOST_TRIPLE="aarch64-apple-darwin" ;;
  Darwin-x86_64)  HOST_TRIPLE="x86_64-apple-darwin" ;;
  Linux-x86_64)   HOST_TRIPLE="x86_64-unknown-linux-gnu" ;;
  Linux-aarch64)  HOST_TRIPLE="aarch64-unknown-linux-gnu" ;;
  *)
    echo "Unsupported platform: ${PLATFORM}/${ARCH} — skipping binary download." >&2
    exit 0
    ;;
esac

# Accept an optional target triple override (for CI cross-compilation).
TRIPLE="${1:-$HOST_TRIPLE}"

echo "Host triple:   $HOST_TRIPLE"
echo "Target triple: $TRIPLE"

# ── [1/2] yt-dlp ─────────────────────────────────────────────────────────────
EXE_SUFFIX=""
[[ "$TRIPLE" == *windows* ]] && EXE_SUFFIX=".exe"

YTDLP_DEST="$BINARIES_DIR/yt-dlp-$TRIPLE$EXE_SUFFIX"

echo ""
echo "[1/2] yt-dlp"

if [ -f "$YTDLP_DEST" ]; then
  echo "  yt-dlp already exists, skipping."
else
  case "$TRIPLE" in
    *apple-darwin*)            YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos" ;;
    x86_64-unknown-linux-gnu)  YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" ;;
    aarch64-unknown-linux-gnu) YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64" ;;
    *windows*)                 YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" ;;
    *) echo "  No yt-dlp URL for triple $TRIPLE — skipping." >&2; YTDLP_URL="" ;;
  esac
  if [ -n "${YTDLP_URL:-}" ]; then
    echo "  Downloading $YTDLP_URL"
    curl -fL --progress-bar -o "$YTDLP_DEST" "$YTDLP_URL"
    chmod 755 "$YTDLP_DEST"
    echo "  yt-dlp saved to $YTDLP_DEST"
  fi
fi

# ── [2/2] ffmpeg ──────────────────────────────────────────────────────────────
FFMPEG_DEST="$BINARIES_DIR/ffmpeg-$TRIPLE$EXE_SUFFIX"

echo ""
echo "[2/2] ffmpeg"

if [ -f "$FFMPEG_DEST" ]; then
  echo "  ffmpeg already exists, skipping."
else
  if [[ "$TRIPLE" == *apple-darwin* ]]; then
    if [[ "$TRIPLE" == "x86_64-apple-darwin" && "$HOST_TRIPLE" == "aarch64-apple-darwin" ]]; then
      # Cross-compile on ARM runner: use Intel Homebrew (Rosetta 2) at /usr/local
      echo "  Cross-compiling: installing ffmpeg via Intel Homebrew (Rosetta 2)"
      arch -x86_64 /usr/local/bin/brew install --quiet ffmpeg
      FFMPEG_SRC="$(arch -x86_64 /usr/local/bin/brew --prefix ffmpeg)/bin/ffmpeg"
    else
      brew install --quiet ffmpeg 2>/dev/null || true
      FFMPEG_SRC="$(brew --prefix ffmpeg)/bin/ffmpeg"
    fi
    cp "$FFMPEG_SRC" "$FFMPEG_DEST"
    chmod 755 "$FFMPEG_DEST"
  elif [[ "$TRIPLE" == "x86_64-unknown-linux-gnu" ]]; then
    FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
    TAR_PATH="$BINARIES_DIR/ffmpeg.tar.xz"
    echo "  Downloading $FFMPEG_URL"
    curl -fL --progress-bar -o "$TAR_PATH" "$FFMPEG_URL"
    tar -xf "$TAR_PATH" -C "$BINARIES_DIR" --strip-components=1 --wildcards "*/ffmpeg"
    mv "$BINARIES_DIR/ffmpeg" "$FFMPEG_DEST"
    rm -f "$TAR_PATH"
    chmod 755 "$FFMPEG_DEST"
  elif [[ "$TRIPLE" == "aarch64-unknown-linux-gnu" ]]; then
    FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz"
    TAR_PATH="$BINARIES_DIR/ffmpeg.tar.xz"
    echo "  Downloading $FFMPEG_URL"
    curl -fL --progress-bar -o "$TAR_PATH" "$FFMPEG_URL"
    tar -xf "$TAR_PATH" -C "$BINARIES_DIR" --strip-components=1 --wildcards "*/ffmpeg"
    mv "$BINARIES_DIR/ffmpeg" "$FFMPEG_DEST"
    rm -f "$TAR_PATH"
    chmod 755 "$FFMPEG_DEST"
  elif [[ "$TRIPLE" == *windows* ]]; then
    ZIP_PATH="$BINARIES_DIR/ffmpeg.zip"
    FFMPEG_URL="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    echo "  Downloading $FFMPEG_URL"
    curl -fL --progress-bar -o "$ZIP_PATH" "$FFMPEG_URL"
    unzip -jo "$ZIP_PATH" "*/bin/ffmpeg.exe" -d "$BINARIES_DIR"
    mv "$BINARIES_DIR/ffmpeg.exe" "$FFMPEG_DEST"
    rm -f "$ZIP_PATH"
  else
    echo "  No ffmpeg download configured for triple $TRIPLE — skipping." >&2
  fi
  echo "  ffmpeg saved to $FFMPEG_DEST"
fi

echo ""
echo "Done. Binaries are ready in src-tauri/binaries/"
