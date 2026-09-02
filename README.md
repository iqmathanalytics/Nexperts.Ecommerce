# Nexperts Ecommerce (Phase 1)

Production-ready full-stack store: Next.js storefront + admin, Express REST API, TiDB (MySQL), Cloudflare R2.

## Architecture

See `docs/ARCHITECTURE.md`.

```
frontend  → Cloudflare (Next.js)
backend   → Render (Express)
database  → TiDB Cloud
images    → Cloudflare R2
```

## Local development

1. Create a TiDB Cloud Serverless cluster (or any MySQL 8 compatible database).
2. Copy environment files:

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

3. Set `DATABASE_URL` and `JWT_SECRET` in `backend/.env`.
4. Install and run:

```
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

```
cd frontend
npm install
npm run dev
```

Store: http://localhost:3000  
Admin: http://localhost:3000/admin/login  
API health: http://localhost:4000/health

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Super admin | admin@nexpertsacademy.com | admin@123 |
| Inventory manager | inventory@nexperts.com | Admin@12345 |
| Order manager | orders@nexperts.com | Admin@12345 |
| Customer | customer@nexperts.com | Customer@12345 |

Coupon codes: `WELCOME10`, `FLAT200`, `FESTIVE20`

## Scripts

Backend:

- `npm run dev` — API with reload
- `npm run build` / `npm start` — production
- `npm run db:migrate` — apply `database/schema.sql`
- `npm run db:seed` — catalog, users, orders, reviews

Frontend:

- `npm run dev`
- `npm run build`

## Deployment

See `docs/DEPLOYMENT.md`. Never commit `.env` files.
