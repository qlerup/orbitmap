#!/usr/bin/env bash
# Overfører orbitmap til LXC container og starter den via docker compose.
# Kør fra Git Bash: bash deploy-to-lxc.sh
set -euo pipefail

LXC_HOST="root@10.10.0.152"
LXC_DEST="/opt/orbitmap"
SSH_KEY="$HOME/.ssh/orbitmap"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="/tmp/orbitmap-deploy.tar.gz"

echo "Pakker orbitmap (uden node_modules/.next/db-backups)..."
tar -czf "$ARCHIVE" \
  --exclude='app/node_modules' \
  --exclude='app/.next' \
  --exclude='db/backups' \
  --exclude='*.log' \
  -C "$SCRIPT_DIR" .

echo "Opretter $LXC_DEST på LXC'en..."
ssh -i "$SSH_KEY" "$LXC_HOST" "mkdir -p $LXC_DEST"

echo "Overfører til $LXC_HOST:$LXC_DEST ..."
scp -i "$SSH_KEY" "$ARCHIVE" "$LXC_HOST:$LXC_DEST/orbitmap-deploy.tar.gz"

echo "Udpakker på LXC'en..."
ssh -i "$SSH_KEY" "$LXC_HOST" "cd $LXC_DEST && tar --no-same-owner -xzf orbitmap-deploy.tar.gz && rm orbitmap-deploy.tar.gz"

rm "$ARCHIVE"

echo ""
echo "Filer overført. Starter docker-compose build + up på LXC'en (kan tage et par minutter)..."
ssh -t -i "$SSH_KEY" "$LXC_HOST" "cd $LXC_DEST && docker-compose up -d --build"

echo ""
echo "Orbitmap skulle nu køre på http://10.10.0.152:3005"
