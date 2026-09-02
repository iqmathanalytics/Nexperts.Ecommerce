import { createApp } from "./app";
import { env } from "./config/env";
import { ensureSchema, keepDatabaseWarm } from "./db/ensureSchema";

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`Nexperts API listening on ${env.PORT}`);
  keepDatabaseWarm();
  ensureSchema().catch((err) => console.warn("ensureSchema:", (err as Error).message));
});

function shutdown(signal: string) {
  console.log(`${signal} received — closing server`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
