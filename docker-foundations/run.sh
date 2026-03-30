#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  . "$SCRIPT_DIR/.env"
  set +a
else
  echo "No .env file found. Copy .env.example to .env and fill in your values."
  exit 1
fi

# Create and activate a virtual environment if one doesn't exist
if [ ! -d "$SCRIPT_DIR/.venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv "$SCRIPT_DIR/.venv"
fi

. "$SCRIPT_DIR/.venv/bin/activate"

# Install dependencies
pip install --quiet -r "$SCRIPT_DIR/api/requirements.txt"

# Run the server
python "$SCRIPT_DIR/api/main.py"
