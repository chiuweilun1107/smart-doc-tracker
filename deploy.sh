#!/bin/bash
# Smart Doc Tracker - Deploy to Hetzner
# Usage: ./deploy.sh

set -e

SERVER="root@5.78.118.41"
SSH_KEY="$HOME/.ssh/id_hetzner_migration"
REMOTE_DIR="/root/smart-doc-tracker"

echo "=== Syncing to production server ==="
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'venv' \
  --exclude '.next' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  --exclude '.vercel' \
  --exclude 'supabase/.temp' \
  --exclude 'frontend-rfp-backup' \
  --exclude '*.server-backup' \
  -e "ssh -i $SSH_KEY" \
  "$(dirname "$0")/" \
  "$SERVER:$REMOTE_DIR/"

echo ""
echo "=== Rebuilding containers ==="
ssh -i "$SSH_KEY" "$SERVER" "cd $REMOTE_DIR && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"

echo ""
echo "=== Done! ==="
ssh -i "$SSH_KEY" "$SERVER" "docker ps --filter 'name=sdt-' --format 'table {{.Names}}\t{{.Status}}'"
