#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$ROOT_DIR/app"
TOOLS_DIR="$APP_DIR/tools"
RELEASE="${LLAMA_RELEASE:-b9631}"
PLATFORM="$(uname -s)"
ARCH="$(uname -m)"

download_and_extract() {
  local asset="$1"
  local dest="$2"
  local archive="$TOOLS_DIR/$asset"
  local url="https://github.com/ggml-org/llama.cpp/releases/download/$RELEASE/$asset"

  if [[ -x "$dest/llama-server" ]]; then
    echo "   OK   llama.cpp backend already ready: $dest"
    return
  fi

  mkdir -p "$TOOLS_DIR" "$dest"
  rm -f "$archive" "$archive.part"
  echo "   >>   Downloading $asset"
  curl -fSL --progress-bar "$url" -o "$archive.part"
  mv "$archive.part" "$archive"
  tar -xzf "$archive" -C "$dest" --strip-components=1
  rm -f "$archive"
  chmod +x "$dest"/llama-* 2>/dev/null || true

  if [[ ! -x "$dest/llama-server" ]]; then
    echo "   XX   llama-server was not found after extracting $asset" >&2
    exit 1
  fi
}

if [[ "$PLATFORM" == "Darwin" ]]; then
  if [[ "$ARCH" == "arm64" ]]; then
    download_and_extract "llama-$RELEASE-bin-macos-arm64.tar.gz" "$APP_DIR/llm-backend/mac/arm64"
  else
    download_and_extract "llama-$RELEASE-bin-macos-x64.tar.gz" "$APP_DIR/llm-backend/mac/x64"
  fi
elif [[ "$PLATFORM" == "Linux" ]]; then
  if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    download_and_extract "llama-$RELEASE-bin-ubuntu-vulkan-arm64.tar.gz" "$APP_DIR/llm-backend/linux/vulkan"
    download_and_extract "llama-$RELEASE-bin-ubuntu-arm64.tar.gz" "$APP_DIR/llm-backend/linux/cpu"
  else
    download_and_extract "llama-$RELEASE-bin-ubuntu-vulkan-x64.tar.gz" "$APP_DIR/llm-backend/linux/vulkan"
    download_and_extract "llama-$RELEASE-bin-ubuntu-x64.tar.gz" "$APP_DIR/llm-backend/linux/cpu"
  fi
else
  echo "Unsupported platform: $PLATFORM" >&2
  exit 1
fi
