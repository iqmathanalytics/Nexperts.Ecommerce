# Schema and migrations for TiDB / MySQL.

- `schema.sql` — canonical CREATE TABLE statements (used by `npm run db:migrate` in backend).
- ORM models live in `backend/src/db/schema.ts` (Drizzle) and must stay in sync with `schema.sql`.

Apply:

```
cd backend
npm run db:migrate
npm run db:seed
```
