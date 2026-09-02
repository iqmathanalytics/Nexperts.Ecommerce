import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../config/env";
import * as schema from "./schema";

export const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 8,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  connectTimeout: 12_000,
  timezone: "Z",
});

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
