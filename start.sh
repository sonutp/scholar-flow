#!/bin/bash
# OmniStudy (ScholarFlow) Startup Script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "========================================================"
echo " Starting OmniStudy (ScholarFlow) Workspace Application"
echo "========================================================"
echo "Port: 8080"
echo "Open your browser at: http://localhost:8080"
echo "Press Ctrl+C to stop the server."
echo "========================================================"

python3 server.py
