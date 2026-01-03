#!/bin/bash

# Cross-platform build script for XIW-BOT
# Runs on Git Bash (Windows) and Bash (WSL/Linux)

set -e

# Ensure Bun is in PATH (Common install locations)
export PATH="$HOME/.bun/bin:$PATH"

# Check dependencies
if ! command -v bun &> /dev/null; then
    echo "Error: 'bun' is not installed or not in PATH."
    exit 1
fi

# Detect Directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$BASE_DIR/bin"
RELEASE_DIR="$BASE_DIR/release"

echo "---------------------------------------"
echo "  XIW-BOT Build System"
echo "---------------------------------------"

# 1. Build UI
echo "[1/4] Building UI..."
cd "$BASE_DIR/src/ui"
# Check if node_modules exists, else install
if [ ! -d "node_modules" ]; then
    echo "  > Installing UI dependencies..."
    bun install
fi
bun run build
cd "$BASE_DIR"

# 2. Embed Assets
echo "[2/4] Embedding Assets..."
bun run embed

# 3. Compile Server
echo "[3/4] Compiling Server..."
# Ensure bin dir exists
mkdir -p "$BIN_DIR"
# Clean old binaries
rm -f "$BIN_DIR/bot-server" "$BIN_DIR/bot-server.exe"

bun run build:server

# 4. Packaging
echo "[4/4] Packaging Release..."
# Clean previous release to avoid stale files
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# Detect OS
HOST_OS="$(uname -s)"
case "$HOST_OS" in
    CYGWIN*|MINGW*|MSYS*)
        PLATFORM="windows"
        BINARY="bot-server.exe"
        ;;
    Linux*)
        PLATFORM="linux"
        BINARY="bot-server"
        ;;
    *)
        PLATFORM="unknown"
        BINARY="bot-server"
        ;;
esac

echo "  > Detected Platform: $PLATFORM"

TARGET_DIR="$RELEASE_DIR/$PLATFORM"
mkdir -p "$TARGET_DIR"

SOURCE_BINARY="$BIN_DIR/$BINARY"

if [ -f "$SOURCE_BINARY" ]; then
    echo "  > Moving binary to $TARGET_DIR..."
    mv "$SOURCE_BINARY" "$TARGET_DIR/$BINARY"
    
    echo "---------------------------------------"
    echo "Build Success!"
    echo "Artifact: release/$PLATFORM/$BINARY"
    echo "---------------------------------------"
    
    # Optional: Verify file exists
    ls -l "$TARGET_DIR/$BINARY"
else
    echo "Error: Binary not found at $SOURCE_BINARY"
    exit 1
fi
