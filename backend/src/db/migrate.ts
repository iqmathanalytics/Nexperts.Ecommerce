import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../config/env";

async function main() {
  const sqlPath = path.join(__dirname, "../../../database/schema.sql");
  const raw = fs.readFileSync(sqlPath, "utf8");
  const statements = raw
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  const conn = await mysql.createConnection(env.DATABASE_URL);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  await conn.end();
  console.log(`Applied ${statements.length} SQL statements from schema.sql`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
