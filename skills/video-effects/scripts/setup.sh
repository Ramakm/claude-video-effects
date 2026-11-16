#!/usr/bin/env bash
# One-time setup for techwith.ram video effects. Safe to run again: prints READY when everything is in place.
set -e
cd "$(dirname "$0")/.."

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "NEED_FFMPEG: install ffmpeg first (Mac: brew install ffmpeg, Windows: winget install ffmpeg, Linux: sudo apt install ffmpeg)"; exit 1
fi

check() { .venv/bin/python -c "import cv2, numpy, mediapipe, playwright" 2>/dev/null && [ -f .venv/.chromium-ok ]; }
if [ -x .venv/bin/python ] && check; then echo READY; exit 0; fi

PY=""
for v in python3.12 python3.11 python3.13 python3.10 python3; do
  if command -v "$v" >/dev/null 2>&1 && "$v" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info[:2] <= (3, 13) else 1)' 2>/dev/null; then PY="$v"; break; fi
done

if [ -n "$PY" ]; then
  "$PY" -m venv .venv
  .venv/bin/python -m pip install -q --upgrade pip
  .venv/bin/python -m pip install -q -r requirements.txt
elif command -v uv >/dev/null 2>&1; then
  uv venv -q -p 3.12 .venv
  uv pip install -q -p .venv/bin/python -r requirements.txt
else
  echo "NEED_PYTHON: install Python 3.12 (python.org/downloads), then run this again"; exit 1
fi

.venv/bin/python -m playwright install chromium >/dev/null && touch .venv/.chromium-ok
check && echo READY
