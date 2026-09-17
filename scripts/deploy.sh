#!/bin/bash

set -e

PROJECT_DIR="/home/ec2-user/CloudOps-Automator"
VENV="/home/ec2-user/cloudops-venv312"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
DEPLOY_DIR="/var/www/cloudops"

echo "========================================"
echo " CloudOps Automator Deployment"
echo "========================================"

cd "$PROJECT_DIR"

echo "[1/8] Checking Git working tree..."

if [ -n "$(git status --porcelain | grep -v '^ M backend/db.sqlite3$')" ]; then
    echo "ERROR: Git working tree is not clean."
    echo "Commit or remove local changes before deployment."
    git status --short
    exit 1
fi

echo "Git working tree is clean."

echo "[2/8] Fetching latest code from GitHub..."
git fetch origin

echo "[3/8] Checking whether main has new commits..."

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "New GitHub commit detected."
    git pull --ff-only origin main
else
    echo "Already up to date."
fi

echo "[4/8] Installing backend dependencies..."
"$VENV/bin/pip" install -r "$BACKEND_DIR/requirements.txt"

echo "[5/8] Running Django checks and migrations..."
cd "$BACKEND_DIR"

"$VENV/bin/python" manage.py check
"$VENV/bin/python" manage.py migrate --noinput

echo "[6/8] Building React frontend..."
cd "$FRONTEND_DIR"

npm ci
npm run build

echo "[7/8] Publishing frontend and restarting services..."

sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r "$FRONTEND_DIR/dist/." "$DEPLOY_DIR/"
sudo chown -R nginx:nginx "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

sudo systemctl restart cloudops
sudo systemctl restart nginx

echo "[8/8] Running health check..."
sleep 2

HEALTH_RESPONSE=$(curl -fsS http://127.0.0.1/api/health/)

echo "Health response:"
echo "$HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "========================================"
    echo " DEPLOYMENT SUCCESSFUL"
    echo "========================================"
    exit 0
else
    echo "========================================"
    echo " DEPLOYMENT FAILED: Health check failed"
    echo "========================================"
    exit 1
fi
