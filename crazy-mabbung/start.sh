#!/bin/bash
# Default port to argument 1 or 8002
PORT=${1:-8002}

# Check if python3 is available
if command -v python3 &>/dev/null; then
    echo "Starting server at http://localhost:$PORT"
    python3 -m http.server $PORT
else
    echo "Error: python3 is not installed or not found in PATH."
    exit 1
fi
