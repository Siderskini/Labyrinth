#!/bin/bash
set -euo pipefail

# ==== edit these paths ====
APP_DIR="/home/$(whoami)/Labyrinth"
NODE_BIN="$(command -v node || echo /usr/bin/node)"   # put your absolute node path if needed
APP_JS="$APP_DIR/index.js"
LOG_DIR="$APP_DIR/logs"
PIDFILE="$APP_DIR/run/app.pid"
# ==========================

mkdir -p "$LOG_DIR" "$(dirname "$PIDFILE")"
cd "$APP_DIR"

# is it already running? (match full path to avoid false positives)
if pgrep -f "$NODE_BIN\s+$APP_JS" >/dev/null; then
  echo "App already running"
  exit 0
fi

echo "Starting: $APP_JS using $NODE_BIN"

# start in background, keep running after cron exits, log stdout/stderr
nohup "$NODE_BIN" "$APP_JS" >>"$LOG_DIR/app.out.log" 2>>"$LOG_DIR/app.err.log" &
echo $! > "$PIDFILE"
echo "PID $(cat "$PIDFILE")"