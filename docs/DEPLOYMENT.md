# Deployment

## Backend on Render

See **`docs/RENDER_DEPLOYMENT.md`** for the new service `nexperts-ecommerce-api`.

Quick steps:

1. Fill `.env.render.local` from `.env.render.local.example`.
2. Run `.\scripts\render-create-service.ps1` (or use Render Blueprint with `render.yaml`).
3. Verify `https://nexperts-ecommerce-api.onrender.com/health`.
4. Run `npm run db:seed` once from Render Shell if needed.

Legacy service `nexperts-api` is left unchanged.

## Frontend on Cloudflare

Deployed Worker: **https://nexperts-store.quorentanalytics.workers.dev**

Local deploy (already logged in via Wrangler):

```
cd frontend
npm run deploy
```

Env in `frontend/.env.production`:

- `NEXT_PUBLIC_API_URL=https://nexperts-ecommerce-api.onrender.com/api/v1`
- `NEXT_PUBLIC_SITE_URL=https://nexperts-store.quorentanalytics.workers.dev`

Render `FRONTEND_URL` / `ADMIN_FRONTEND_URL` must match the store URL exactly.
## Database on TiDB Cloud

1. Create a Serverless cluster.
2. Create database `nexperts`.
3. Copy the connection string into `DATABASE_URL`.
4. Allow the Render egress IPs if the cluster is not public.

## Images on Cloudflare R2

1. Create a bucket.
2. Create an API token with Object Read & Write.
3. Enable a public development URL or custom domain and set `R2_PUBLIC_BASE_URL`.
4. If R2 is not configured, the API stores files under `backend/uploads` for local development.

## CORS and cookies

Production cookies use `SameSite=None; Secure`. The API `FRONTEND_URL` must match the store origin exactly.

## Premium redesign notes

- Run `npm run db:migrate` after pulling Wave 3 schema changes (collections, lookbooks, loyalty, fit, waitlist, GDPR tables).
- Re-seed optionally for festive/summer collections and loyalty demo balance.
- Optional frontend env: `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INTERCOM_APP_ID`.
- Online checkout: set `PAYMENT_PROVIDER=razorpay` plus `PAYMENT_KEY` / `PAYMENT_SECRET` on Render.
- Monitoring: Sentry DSN on frontend if configured; UptimeRobot on `/health` and the Worker URL.
- Email journeys live in `backend/src/jobs/emailJourneys.ts` — attach a Render cron to call `runEmailCronTick`.

