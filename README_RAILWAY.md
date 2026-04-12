Railway deployment helper

Files added:
- railway.json — manifest with start/build command and environment keys
- scripts/railway_deploy.sh — wrapper to build and call 'railway up' (requires Railway CLI)
- scripts/railway_set_envs.sh — sets env variables from .env using 'railway variables set'

What to do next:
1. Install Railway CLI: https://docs.railway.app/cli
2. Copy .env.example -> .env and fill values
3. Login: railway login
4. Initialize/project: railway init --name flowmarket-backend (or let the deploy script do it)
5. Set envs: ./scripts/railway_set_envs.sh .env
6. Deploy: ./scripts/railway_deploy.sh

Notes:
- This environment could not find a Railway CLI or API key, so envs were not pushed automatically.
- If you want me to attempt pushing envs via Railway API, provide a Railway API key (RAILWAY_API_KEY) and confirm.
