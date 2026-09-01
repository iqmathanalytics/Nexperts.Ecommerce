import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError, type AuthedUser } from "../utils/http";

const cookies = {
  customer: "customer_token",
  admin: "admin_token",
} as const;

export function signToken(payload: Omit<AuthedUser, "permissions"> & { permissions: string[] }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: Boolean(env.COOKIE_SECURE) || env.NODE_ENV === "production",
    sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function setAuthCookie(res: Response, kind: "customer" | "admin", token: string) {
  res.cookie(cookies[kind], token, cookieOptions());
}

export function clearAuthCookie(res: Response, kind: "customer" | "admin") {
  res.clearCookie(cookies[kind], { ...cookieOptions(), maxAge: 0 });
}

function readToken(req: Request, kind: "customer" | "admin"): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[cookies[kind]] as string | undefined;
}

function authenticate(kind: "customer" | "admin", optional = false) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = readToken(req, kind);
    if (!token) {
      if (optional) return next();
      return next(new AppError("UNAUTHENTICATED", "Please sign in", 401));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthedUser;
      if (decoded.kind !== kind) {
        return next(new AppError("UNAUTHENTICATED", "Invalid session", 401));
      }
      req.user = decoded;
      next();
    } catch {
      if (optional) return next();
      next(new AppError("UNAUTHENTICATED", "Session expired", 401));
    }
  };
}

export const requireCustomer = authenticate("customer");
export const optionalCustomer = authenticate("customer", true);
export const requireAdmin = authenticate("admin");

export function requirePermission(...codes: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("UNAUTHENTICATED", "Please sign in", 401));
    const ok = codes.some((c) => req.user!.permissions.includes(c) || req.user!.roles.includes("SUPER_ADMIN"));
    if (!ok) return next(new AppError("FORBIDDEN", "You do not have permission for this action", 403));
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}
