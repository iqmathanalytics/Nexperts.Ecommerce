# Deployment

## Backend on Render

1. Create a Web Service from this GitHub repo.
2. Root directory: `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Health check: `/health`
6. Add environment variables from `docs/ENVIRONMENT.md`.
7. After first deploy, run from a Render shell:

```
npm run db:migrate
npm run db:seed
```

`render.yaml` is included at the repo root.

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
