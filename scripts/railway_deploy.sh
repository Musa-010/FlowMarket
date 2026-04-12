#!/usr/bin/env bash
set -euo pipefail

# Usage: ./railway_deploy.sh
# This script automates deployment to Railway using the Railway CLI.
# It requires the Railway CLI to be installed and you to be logged in.

if ! command -v railway >/dev/null 2>&1; then
  echo "railway CLI not found. Install from https://docs.railway.app/cli and log in first."
  exit 1
fi

# Initialize project (if not already)
if ! railway status >/dev/null 2>&1; then
  echo "Initializing Railway project (you will be prompted)."
  railway init --name flowmarket-backend || true
fi

# Build and deploy
echo "Building backend..."
npm ci
npm run build

echo "Deploying to Railway (this will open or create the project)..."
railway up --detach

echo "Deployment initiated. Use 'railway status' and 'railway logs' to follow progress."
