import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../config/env";
import * as schema from "./schema";

export const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  // Storefront pages fire 6–10 queries at once; 8 caused 3–5s waits under that burst.
  connectionLimit: 24,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  connectTimeout: 12_000,
  timezone: "Z",
});

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
