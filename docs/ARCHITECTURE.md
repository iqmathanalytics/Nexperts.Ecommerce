# Nexperts Ecommerce — Phase 1 Architecture

## Overview

Production-ready full-stack ecommerce platform.

| Layer | Technology | Deploy |
|---|---|---|
| Storefront + Admin UI | Next.js, React, TypeScript, Tailwind, shadcn/ui | Cloudflare |
| REST API | Node.js, Express, TypeScript | Render |
| Database | TiDB Cloud (MySQL-compatible), Drizzle ORM, mysql2 | TiDB Cloud |
| Images | Cloudflare R2 (S3-compatible) | Cloudflare R2 |
| Source | GitHub | — |

Customer and admin UIs share one Next.js app with isolated route groups and auth cookies. All business logic lives on the backend.

## Folder structure

```
/frontend     Next.js App Router (storefront + admin)
/backend      Express REST API
/shared       Shared TypeScript types, constants, Zod schemas
/database     Drizzle schema, migrations, seed
/docs         Architecture and deployment
```

## Request flow

```
Browser → Next.js (Cloudflare)
       → REST /api/v1/* (Render)
       → Drizzle → TiDB Cloud
       → R2 (signed uploads / public URLs)
```

## Auth model

- Passwords hashed with bcrypt (cost 12).
- JWT access tokens in httpOnly, Secure, SameSite cookies.
- Customer cookie: `customer_token`
- Admin cookie: `admin_token`
- Password reset tokens hashed in DB, short TTL.
- RBAC enforced on every admin route. Frontend only hides UI.

### Roles

`SUPER_ADMIN`, `ADMIN`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `ANALYST`, `CUSTOMER`

## Money and inventory

- Money stored as `DECIMAL(12,2)`.
- Discount, tax, shipping, coupon math computed on the server.
- Inventory is per variant. `available = stock - reserved`.
- Checkout reserves stock; cancel/fail releases it. Stock cannot go negative.

## Order numbers

Format: `ORD-YYYY-000001` (year + zero-padded sequence).

## Order status transitions

```
PENDING → CONFIRMED | CANCELLED
CONFIRMED → PROCESSING | CANCELLED
PROCESSING → PACKED | CANCELLED
PACKED → SHIPPED
SHIPPED → DELIVERED
DELIVERED (terminal)
CANCELLED (terminal)
```

Customers may cancel `PENDING`, `CONFIRMED`, or `PROCESSING`.

## Payment

`PaymentProvider` interface. Phase 1: Cash on Delivery. Online provider is a stub that can be swapped without changing checkout.

Statuses: `PENDING | SUCCESS | FAILED | REFUNDED`

## API format

Success: `{ "success": true, "data": {}, "meta": { "page", "limit", "total" } }`
Error: `{ "success": false, "error": { "code", "message" } }`

Base path: `/api/v1`

## Frontend routes

Store: `/`, `/products`, `/products/[slug]`, `/category/[slug]`, `/search`, `/cart`, `/checkout`, `/checkout/success`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account/*`

Admin: `/admin/login`, `/admin`, `/admin/products`, `/admin/products/create`, `/admin/products/[id]`, `/admin/categories`, `/admin/brands`, `/admin/inventory`, `/admin/orders`, `/admin/customers`, `/admin/coupons`, `/admin/reviews`, `/admin/analytics`, `/admin/reports`, `/admin/users`, `/admin/settings`

## Phase 2 extension points

Payments, shipping adapters, notifications, recommendations, multi-vendor, subscriptions, CRM, and marketing all plug in behind existing service interfaces without schema rewrites.
