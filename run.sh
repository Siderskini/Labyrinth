#!/bin/bash
set -euo pipefail

# ==== edit these paths ====
APP_DIR="/home/$(whoami)/Labyrinth"
NODE_BIN="$(command -v node || echo /usr/bin/node)"   # put your absolute node path if needed
APP_JS="$APP_DIR/index.js"
LOG_DIR="$APP_DIR/logs"
PIDFILE="$APP_DIR/run/app.pid"
# ==========================

# Optional port argument (default 4000)
PORT="${1:-4000}"

# --- Detect public IP ---
# Tries cloud provider metadata endpoints in order, then a public lookup, then falls back to local IP.
get_public_ip() {
  local ip

  # AWS
  ip=$(curl -s --max-time 1 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null) \
    && [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "$ip" && return

  # GCP
  ip=$(curl -s --max-time 1 -H "Metadata-Flavor: Google" \
    http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null) \
    && [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "$ip" && return

  # Azure
  ip=$(curl -s --max-time 1 -H "Metadata:true" \
    "http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2021-02-01&format=text" 2>/dev/null) \
    && [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "$ip" && return

  # Generic public IP fallback
  ip=$(curl -s --max-time 3 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]') \
    && [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "$ip" && return

  # Local IP fallback
  ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo "${ip:-localhost}"
}

# --- Check if host:port is reachable ---
check_reachable() {
  local host="$1" port="$2"
  if command -v nc >/dev/null 2>&1; then
    nc -z -w5 "$host" "$port" 2>/dev/null
  else
    # bash built-in TCP as fallback if nc is unavailable
    (echo > /dev/tcp/"$host"/"$port") 2>/dev/null
  fi
}

HOST=$(get_public_ip)
echo "Detected host: $HOST"

mkdir -p "$LOG_DIR" "$(dirname "$PIDFILE")"
cd "$APP_DIR"

# Write config.json for the server
echo "{\"host\": \"$HOST\", \"port\": $PORT}" > "$APP_DIR/config.json"
echo "Config: host=$HOST port=$PORT"

# Update client-side connection in public/main.js
sed -i "s/const host = '.*';/const host = '$HOST';/" "$APP_DIR/public/main.js"
sed -i "s/const port = [0-9]*;/const port = $PORT;/" "$APP_DIR/public/main.js"

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

# Wait for server to start, then verify reachability
echo "Waiting for server to start..."
sleep 3
if check_reachable "$HOST" "$PORT"; then
  echo "OK: Server is reachable at $HOST:$PORT"
else
  echo "WARNING: Server does not appear to be reachable at $HOST:$PORT"
  echo "         Possible causes: firewall rules, security groups, or port not yet open."
  echo "         Check server logs at: $LOG_DIR/app.err.log"
fi
