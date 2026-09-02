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

1. Create a Cloudflare Pages/Workers project for `frontend`.
2. Build command: `npx next build` (or OpenNext: `npx @opennextjs/cloudflare build`)
3. Set `NEXT_PUBLIC_API_URL` to the Render API URL including `/api/v1`.
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain.

For Next.js on Cloudflare Workers, use OpenNext:

```
cd frontend
npx @opennextjs/cloudflare build
npx wrangler deploy
```

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
