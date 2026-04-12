# FlowMarket Backend (NestJS)

NestJS API for FlowMarket with Prisma + SQLite (local dev), Supabase Storage uploads, workflows marketplace, Stripe payments, and Claude-powered recommendations.

## Setup

```bash
npm install
cp .env.example .env
```

## Environment variables

```env
DATABASE_URL="file:./dev.db"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="workflows"
APP_URL="http://localhost:3000"
AWS_REGION="us-east-1"
AWS_SES_FROM_EMAIL="no-reply@flowmarket.io"
AWS_SES_ACCESS_KEY_ID=""
AWS_SES_SECRET_ACCESS_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_CHECKOUT_SUCCESS_URL=""
STRIPE_CHECKOUT_CANCEL_URL=""
STRIPE_PORTAL_RETURN_URL=""
STRIPE_PRICE_STARTER=""
STRIPE_PRICE_PRO=""
STRIPE_PRICE_AGENCY=""
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
ENCRYPTION_KEY=""
REDIS_URL="redis://localhost:6379/0"
N8N_BASE_URL=""
N8N_API_KEY=""
FIREBASE_SERVICE_ACCOUNT_JSON=""
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
```

## Database

```bash
npm run prisma:migrate
npm run prisma:seed
```

Seeding inserts demo users and **15 starter workflows**.

## Run

```bash
npm run start:dev
```

Base URL: `http://localhost:3000/api/v1`

## Modules and endpoints

### Workflows

- `GET /workflows` — public list with `search`, `category`, `platform`, `minPrice`, `maxPrice`, `minRating`, `sort`, `page`, `limit`
- `GET /workflows/featured` — featured workflows
- `GET /workflows/:slug` — workflow detail by slug
- `GET /seller/workflows` — seller workflows (requires `x-user-id`, `x-user-role=SELLER`)
- `POST /seller/workflows` — create draft workflow
- `PATCH /seller/workflows/:id` — update seller workflow
- `POST /seller/workflows/:id/submit` — submit for admin review
- `GET /admin/workflows` — admin list/filter (`status` + public filters)
- `PATCH /admin/workflows/:id/moderate` — approve/reject workflow
- `PATCH /admin/workflows/:id/feature` — toggle featured

### Purchases

- `GET /purchases` — paginated purchases for current user
- `POST /purchases` — create purchase (`workflowId`, optional `pricePaid`, `stripePaymentId`)

### Storage (Supabase)

- `POST /storage/upload-url` — create signed upload URL for workflow files/images (requires `x-user-id`, seller/admin role)

### Payments (Stripe)

- `POST /checkout/one-time` — create Stripe Checkout session for one-time workflow purchase
- `POST /checkout/subscription` — create Stripe Checkout session for subscription plan
- `POST /checkout/portal` — create Stripe customer portal URL
- `POST /checkout/webhook` — Stripe webhook endpoint (raw body + `stripe-signature`)

Handled webhook events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### AI (Claude)

- `POST /ai/recommend` — workflow recommendation endpoint with payload:
  - `{ "message": "...", "history": [{ "role": "user|assistant", "content": "..." }] }`
  - response: `{ "message": "...", "recommendations": [Workflow...] }`

### Deployments (BullMQ + n8n)

- `GET /deployments` — list user deployments
- `POST /deployments` — create deployment (`workflowId`, optional `config`)
- `GET /deployments/:id` — deployment detail
- `POST /deployments/:id/configure` — update encrypted deployment config and enqueue background deployment
- `POST /deployments/:id/pause` — pause deployment
- `POST /deployments/:id/resume` — resume deployment
- `POST /deployments/:id/stop` — stop deployment
- `GET /deployments/:id/logs` — list execution logs

Background processing uses BullMQ with Redis (`REDIS_URL`). If Redis is not configured, deployment jobs run inline.

### Reviews

- `GET /reviews/workflows/:workflowId` — list reviews for a workflow (paginated)
- `POST /reviews/workflows/:workflowId` — create/update buyer review (requires prior purchase)

### Notifications (FCM)

- `GET /notifications` — list notifications (paginated)
- `POST /notifications/mark-read` — mark selected notifications as read (or all unread if no IDs provided)
- `POST /notifications/device-token` — register/update FCM device token

### Email (AWS SES)

Transactional email templates are sent through AWS SES and are wired to existing backend events:

- Welcome
- Purchase Confirmation
- Deployment Active
- Deployment Failed
- Seller Workflow Approved
- Seller Workflow Rejected
- Payout Processed
- Subscription Renewal
- Payment Failed

## Auth notes

Phase currently uses request headers for role simulation:

- `x-user-id`
- `x-user-role` (`BUYER`, `SELLER`, `ADMIN`)

This can be replaced by JWT auth in a later phase.
