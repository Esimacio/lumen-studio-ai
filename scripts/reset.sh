#!/usr/bin/env bash
#
# Local AI Studio - Linux/macOS Reset Script
# Resets portable app dependencies/builds while preserving user models and outputs.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$ROOT_DIR/app"

echo ""
echo "  ============================================================"
echo "   Resetting Local AI Studio..."
echo "  ============================================================"
echo ""

# Delete tools/node
if [[ -d "$APP_DIR/tools" ]]; then
  echo "   >> Removing portable tools/ node folder..."
  rm -rf "$APP_DIR/tools"
fi

# Delete backend
if [[ -d "$APP_DIR/backend" ]]; then
  echo "   >> Removing image backend binaries..."
  rm -rf "$APP_DIR/backend"
fi

# Delete llama.cpp backend
if [[ -d "$APP_DIR/llm-backend" ]]; then
  echo "   >> Removing llama.cpp text backend binaries..."
  rm -rf "$APP_DIR/llm-backend"
fi

# Delete dist
if [[ -d "$APP_DIR/dist" ]]; then
  echo "   >> Removing dist/ build folder..."
  rm -rf "$APP_DIR/dist"
fi

# Preserve image models
if [[ -d "$APP_DIR/models" ]]; then
  echo "   >> Preserving image models in app/models."
fi

# Preserve text models
if [[ -d "$APP_DIR/llm-models" ]]; then
  echo "   >> Preserving text models in app/llm-models."
fi

# Preserve OpenVINO models
if [[ -d "$APP_DIR/openvino-models" ]]; then
  echo "   >> Preserving OpenVINO models in app/openvino-models."
fi

# Delete all frontend dependency folders, including platform-specific copies
for modules_dir in "$APP_DIR/frontend/node_modules" "$APP_DIR/frontend"/node_modules_*; do
  if [[ -L "$modules_dir" || -d "$modules_dir" ]]; then
    echo "   >> Removing frontend $(basename "$modules_dir")..."
    rm -rf "$modules_dir"
  fi
done

if [[ -f "$APP_DIR/frontend/.active_modules_os" ]]; then
  echo "   >> Removing frontend platform marker..."
  rm -f "$APP_DIR/frontend/.active_modules_os"
fi

# Delete package-lock.json in frontend
if [[ -f "$APP_DIR/frontend/package-lock.json" ]]; then
  echo "   >> Removing frontend package-lock.json..."
  rm -f "$APP_DIR/frontend/package-lock.json"
fi

echo ""
echo "  ============================================================"
echo "   Reset complete. Image models, text models, OpenVINO models, and generated outputs were preserved."
echo "  ============================================================"
echo ""
read -rp "  Press Enter to close..."
