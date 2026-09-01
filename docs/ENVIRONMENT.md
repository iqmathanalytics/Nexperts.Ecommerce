# Environment variables

## Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | yes | TiDB/MySQL connection string with SSL |
| JWT_SECRET | yes | Min 16 characters |
| JWT_EXPIRES_IN | no | Default `7d` |
| COOKIE_SECURE | no | `true` in production |
| FRONTEND_URL | yes | Store origin for CORS |
| ADMIN_FRONTEND_URL | no | Defaults to FRONTEND_URL |
| PORT | no | Default `4000` |
| NODE_ENV | no | `development` or `production` |
| R2_ACCOUNT_ID | for uploads | Cloudflare account id |
| R2_ACCESS_KEY_ID | for uploads | R2 access key |
| R2_SECRET_ACCESS_KEY | for uploads | R2 secret |
| R2_BUCKET_NAME | for uploads | Bucket name |
| R2_PUBLIC_BASE_URL | recommended | Public URL prefix for objects |
| R2_ENDPOINT | no | Custom S3 endpoint |
| PAYMENT_PROVIDER | no | `cod` (default), `razorpay`, or `online` |
| PAYMENT_KEY | no | Razorpay key id / gateway public key |
| PAYMENT_SECRET | no | Razorpay key secret / gateway secret |
| SITE_NAME | no | Used in transactional emails (default `Nexperts`) |
| EMAIL_FROM | no | Sender address for emails |
| SMTP_HOST | no | SMTP server; omit to log emails in development |
| SMTP_PORT | no | Default `587` |
| SMTP_USER | no | SMTP username |
| SMTP_PASS | no | SMTP password |
| SMTP_SECURE | no | `true` for port 465 |
| TAX_RATE | no | Default `0.18` |
| FREE_SHIPPING_MIN | no | Default `999` |
| SHIPPING_FLAT | no | Default `49` |

Example TiDB URL:

```
DATABASE_URL=mysql://USER:PASSWORD@HOST:4000/nexperts?ssl={"rejectUnauthorized":true}
```

## Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Public API, e.g. `https://api.example.com/api/v1` |
| NEXT_PUBLIC_SITE_URL | Canonical site URL |
| NEXT_PUBLIC_SITE_NAME | Brand name |

The frontend must never receive database, JWT, R2, or payment secrets.
