# Render deployment — new service `nexperts-ecommerce-api`

This deploys the Express API to a **new** Render web service. It does **not** modify the legacy `nexperts-api` service.

## What was configured

| Item | Value |
|---|---|
| Service name | `nexperts-ecommerce-api` |
| Region | Singapore (near TiDB ap-southeast-1) |
| Root directory | `backend` |
| Health check | `/health` |
| Database | TiDB Cloud (`DATABASE_URL` with SSL) |

## Your checklist

### 1. Push repo changes (recommended)

Commit and push `render.yaml`, `backend/package.json`, and `scripts/` so future deploys use production migrate/seed scripts:

```powershell
git add render.yaml backend/package.json scripts/ docs/RENDER_DEPLOYMENT.md .env.render.local.example
git commit -m "Add Render deployment config for new API service"
git push origin main
```

### 2. Verify the API

After deploy finishes (2–5 minutes):

```
https://nexperts-ecommerce-api.onrender.com/health
https://nexperts-ecommerce-api.onrender.com/api/v1/categories
```

### 3. Seed database (first time only)

If catalog is empty, run once from **Render Shell** (Dashboard → service → Shell):

```
npm run db:seed
```

Or locally:

```powershell
cd backend
$env:DATABASE_URL='your-tidb-url-with-ssl'
$env:JWT_SECRET='your-jwt-secret'
npm run db:migrate
npm run db:seed
```

### 4. Connect the frontend

When the store is deployed (Cloudflare Pages):

```env
NEXT_PUBLIC_API_URL=https://nexperts-ecommerce-api.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://your-store-domain.com
```

Then update Render env vars **`FRONTEND_URL`** and **`ADMIN_FRONTEND_URL`** to match `NEXT_PUBLIC_SITE_URL` exactly, and redeploy.

### 5. Security

- **Rotate** your Render API key (it was shared in chat).
- Never commit `.env.render.local` or database passwords.

## Seeded accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexpertsacademy.com | admin@123 |
| Customer | customer@nexperts.com | Customer@12345 |

## Troubleshooting

| Issue | Fix |
|---|---|
| Build fails | Check Render logs; ensure GitHub repo is connected |
| DB connection error | Add `?ssl={"rejectUnauthorized":true}` to DATABASE_URL; check TiDB IP allowlist |
| 502 / slow first request | Free tier sleeps after inactivity |
| CORS errors | `FRONTEND_URL` must exactly match browser origin |

## Scripts

```powershell
# Create service + set env + deploy (reads .env.render.local)
.\scripts\render-create-service.ps1
```
