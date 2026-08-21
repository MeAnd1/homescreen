#!/usr/bin/env bash
# Start both halves of the local editor stack, detached, and wait until they answer:
#   - the editor backend (static-page-editors) on :3004, project kataa-local
#   - this app (vite) on :5173, pointed at that backend
#
# Safe to re-run: it skips whichever half is already listening, and rebuilds the
# scratch repo only when it is missing (/tmp is cleared on reboot).
# Stop everything with: scripts/dev-local.sh stop
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="${BACKEND_REPO:-$HERE/../static-page-editors}"
SCRATCH="${SCRATCH_REPO:-/tmp/editor-test}"
LOGS="${LOGS_DIR:-/tmp/kataa-dev}"
API_PORT=3004
APP_PORT=5173

listening() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

wait_for() { # port, name, seconds
  local i=0
  until listening "$1"; do
    i=$((i + 1))
    [ "$i" -ge "$3" ] && { echo "✗ $2 did not come up in $3s — see $LOGS"; return 1; }
    sleep 1
  done
  echo "✓ $2 on :$1"
}

if [ "${1:-start}" = "stop" ]; then
  # nodemon supervises ts-node, so killing the port listener alone just makes it
  # respawn — take down the supervisors by command line as well.
  pkill -f "static-page-editors/node_modules/.bin/nodemon" 2>/dev/null && echo "stopped backend supervisor"
  pkill -f "kataa-homescreen/node_modules/.bin/vite" 2>/dev/null && echo "stopped vite"
  for p in "$API_PORT" "$APP_PORT"; do
    pids=$(lsof -nP -iTCP:"$p" -sTCP:LISTEN -t 2>/dev/null)
    [ -n "$pids" ] && kill $pids 2>/dev/null && echo "stopped :$p"
  done
  exit 0
fi

mkdir -p "$LOGS"

[ -d "$SCRATCH/repo" ] || { echo "rebuilding scratch repo…"; bash "$HERE/scripts/setup-local-editor.sh" "$SCRATCH" >/dev/null; }

if listening "$API_PORT"; then
  echo "✓ backend already on :$API_PORT"
else
  ( cd "$BACKEND" && nohup npm run dev > "$LOGS/backend.log" 2>&1 & )
  wait_for "$API_PORT" backend 45 || exit 1
fi

if listening "$APP_PORT"; then
  echo "✓ app already on :$APP_PORT"
else
  ( cd "$HERE" && nohup npm run dev:local-editor > "$LOGS/vite.log" 2>&1 & )
  wait_for "$APP_PORT" app 45 || exit 1
fi

cat <<EOF

  app      http://localhost:$APP_PORT/homescreen/
  editor   http://localhost:$APP_PORT/homescreen/editor
  backend  http://localhost:$API_PORT   (project kataa-local → $SCRATCH/repo)
  logs     $LOGS/{backend,vite}.log
  stop     scripts/dev-local.sh stop
EOF
