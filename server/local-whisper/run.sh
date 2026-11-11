#!/usr/bin/env bash
# Starts the local OpenAI-compatible whisper server on http://127.0.0.1:9000.
#
#   ./local-whisper/run.sh            # base model (default)
#   WHISPER_MODEL=small ./local-whisper/run.sh
#
# The first request downloads the model, which takes a few minutes.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
venv="${WHISPER_VENV:-$HOME/whisper-local}"

if [ ! -x "$venv/bin/uvicorn" ]; then
  echo "Creating the virtualenv in $venv"
  python3 -m venv "$venv" 2>/dev/null || python3 -m virtualenv "$venv"
  "$venv/bin/pip" install --upgrade pip
  "$venv/bin/pip" install -r "$here/requirements.txt"
fi

echo "Starting the whisper server on http://127.0.0.1:${WHISPER_PORT:-9000}"
exec "$venv/bin/uvicorn" server:app \
  --app-dir "$here" \
  --host "${WHISPER_HOST:-127.0.0.1}" \
  --port "${WHISPER_PORT:-9000}"
