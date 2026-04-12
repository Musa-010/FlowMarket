#!/usr/bin/env bash
set -euo pipefail

# Usage: ./railway_set_envs.sh [env-file]
# If env-file is omitted, it will try to use .env in the backend directory.
# Requires Railway CLI and that you're logged in and have a project set.

ENV_FILE="${1:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file $ENV_FILE not found. Copy .env.example to .env and fill in values."
  exit 1
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "railway CLI not found. Install from https://docs.railway.app/cli and log in first."
  exit 1
fi

# Load env file but ignore comments
set -o allexport
source <(grep -v '^#' "$ENV_FILE" | sed '/^$/d')
set +o allexport

# Map environment variables from file to Railway
VARS=(
  DATABASE_URL
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_STORAGE_BUCKET
  APP_URL
  AWS_REGION
  AWS_SES_FROM_EMAIL
  AWS_SES_ACCESS_KEY_ID
  AWS_SES_SECRET_ACCESS_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_CHECKOUT_SUCCESS_URL
  STRIPE_CHECKOUT_CANCEL_URL
  STRIPE_PORTAL_RETURN_URL
  STRIPE_PRICE_STARTER
  STRIPE_PRICE_PRO
  STRIPE_PRICE_AGENCY
  STRIPE_PRICE_STARTER_MONTHLY
  STRIPE_PRICE_PRO_MONTHLY
  STRIPE_PRICE_AGENCY_MONTHLY
  STRIPE_PRICE_STARTER_YEARLY
  STRIPE_PRICE_PRO_YEARLY
  STRIPE_PRICE_AGENCY_YEARLY
  ANTHROPIC_API_KEY
  ANTHROPIC_MODEL
  ENCRYPTION_KEY
  REDIS_URL
  N8N_BASE_URL
  N8N_API_KEY
  FIREBASE_SERVICE_ACCOUNT_JSON
  FIREBASE_PROJECT_ID
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY
)

for k in "${VARS[@]}"; do
  v=$(printenv "$k" || true)
  if [[ -n "$v" ]]; then
    echo "Setting Railway variable: $k"
    railway variables set "$k" "$v" || true
  else
    echo "Skipping $k — not set in $ENV_FILE"
  fi
done

echo "Done. Verify variables with 'railway variables list'."
