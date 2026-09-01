# API structure

Base: `/api/v1`

Customer:
- POST /auth/register | login | logout | forgot-password | reset-password
- GET/PATCH /auth/me  POST /auth/me/password
- GET /home /products /products/:slug /categories /brands
- GET /products/search/suggest
- CRUD /cart /wishlist /addresses
- POST /checkout/quote  POST /checkout
- GET /orders  GET /orders/:id  POST /orders/:id/cancel
- GET/POST /reviews
- POST /coupons/preview

Admin:
- POST /admin/auth/login  GET /admin/auth/me
- Products, categories, brands, images, inventory, orders, customers, coupons, reviews, analytics, users, audit-logs

Health: GET /health → `{ "status": "ok" }`
