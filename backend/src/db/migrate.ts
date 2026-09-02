import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../config/env";

/** MySQL errno for "Duplicate column name" — safe to ignore on re-migrate. */
const IGNORE_ERRNOS = new Set([1060, 1061]);

async function main() {
  const sqlPath = path.join(__dirname, "../../../database/schema.sql");
  const raw = fs.readFileSync(sqlPath, "utf8");
  const statements = raw
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  const conn = await mysql.createConnection(env.DATABASE_URL);
  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      applied++;
    } catch (err) {
      const errno = (err as { errno?: number }).errno;
      if (errno && IGNORE_ERRNOS.has(errno)) {
        skipped++;
        continue;
      }
      await conn.end();
      throw err;
    }
  }
  await conn.end();
  console.log(`Applied ${applied} SQL statements from schema.sql (${skipped} skipped as already present)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
