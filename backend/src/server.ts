import { createApp } from "./app";
import { env } from "./config/env";
import { ensureSchema, keepDatabaseWarm } from "./db/ensureSchema";

const app = createApp();
// Bind IPv4 so Windows localhost/127.0.0.1 hit this API (avoids clashes with other apps on ::4000).
const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Nexperts API listening on http://127.0.0.1:${env.PORT}`);
  keepDatabaseWarm();
  ensureSchema().catch((err) => console.warn("ensureSchema:", (err as Error).message));
});

function shutdown(signal: string) {
  console.log(`${signal} received — closing server`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
