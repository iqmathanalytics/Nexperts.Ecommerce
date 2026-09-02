import express from "express";
import type { Request } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";
import path from "node:path";
import { env, isProd } from "./config/env";
import { api } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

function allowedOrigins() {
  const configured = [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL];
  const aliases = configured.flatMap((url) => {
    try {
      const parsed = new URL(url);
      const altHost = parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname === "127.0.0.1" ? "localhost" : null;
      if (!altHost) return [];
      const port = parsed.port ? `:${parsed.port}` : "";
      return [`${parsed.protocol}//${altHost}${port}`];
    } catch {
      return [];
    }
  });
  return new Set([...configured, ...aliases]);
}

function isPublicCacheable(req: Request) {
  if (req.method !== "GET") return false;
  const p = req.path;
  return (
    p === "/home" ||
    p === "/editorial" ||
    p === "/products" ||
    p.startsWith("/products/search/suggest") ||
    /^\/products\/[^/]+$/.test(p) ||
    p === "/categories" ||
    /^\/categories\/[^/]+$/.test(p) ||
    p === "/brands" ||
    p === "/commerce"
  );
}

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(compression({ threshold: 1024, level: 6 }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  const origins = allowedOrigins();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origins.has(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const staticOpts = { maxAge: isProd ? "7d" : 0, etag: true, lastModified: true, fallthrough: true };
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), staticOpts));
  app.use("/products", express.static(path.join(process.cwd(), "public/products"), { ...staticOpts, immutable: isProd }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: isProd ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);
  app.use("/api/v1/admin/auth/login", authLimiter);
  app.use("/api/v1", apiLimiter);

  app.use("/api/v1", (req, res, next) => {
    if (isPublicCacheable(req)) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    } else {
      res.setHeader("Cache-Control", "no-store");
    }
    next();
  });
  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
