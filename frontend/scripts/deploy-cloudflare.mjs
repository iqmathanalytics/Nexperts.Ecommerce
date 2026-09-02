/**
 * Deploy OpenNext Worker with .env.production values forced into the process
 * env so they win over .env.local (Next.js otherwise prefers .env.local).
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prodPath = resolve(root, ".env.production");

if (!existsSync(prodPath)) {
  console.error("Missing frontend/.env.production");
  process.exit(1);
}

for (const line of readFileSync(prodPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx < 1) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim();
  process.env[key] = value;
}

console.log(
  `Deploying with NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL} NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL}`,
);

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

await run("npx", ["opennextjs-cloudflare", "build"]);
await run("npx", ["opennextjs-cloudflare", "deploy"]);
