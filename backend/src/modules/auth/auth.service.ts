import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  passwordResetTokens,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "../../db/schema";
import { AppError } from "../../utils/http";
import { audit } from "../../utils/audit";
import { signToken } from "../../middleware/auth";
import { sendPasswordResetEmail } from "../../utils/email";

const SALT_ROUNDS = 12;

export const registerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255).transform((v) => v.toLowerCase()),
  phone: z.string().min(8).max(30).optional(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

export const forgotSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
});

export const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(100),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(8).max(30).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

async function loadAuthContext(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status !== "ACTIVE") {
    throw new AppError("UNAUTHENTICATED", "Account is not active", 401);
  }
  const assigned = await db
    .select({ role: roles.name, permission: permissions.code })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  const roleSet = new Set(assigned.map((r) => r.role));
  const permSet = new Set(assigned.map((r) => r.permission).filter((p): p is string => Boolean(p)));
  return { user, roles: [...roleSet], permissions: [...permSet] };
}

export function publicUser(user: typeof users.$inferSelect, extra?: { roles?: string[] }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    status: user.status,
    roles: extra?.roles ?? [],
  };
}

export async function issueSession(userId: number, kind: "customer" | "admin") {
  const ctx = await loadAuthContext(userId);
  if (kind === "admin" && !ctx.roles.some((r) => r !== "CUSTOMER")) {
    throw new AppError(
      "WRONG_PORTAL",
      "This is a customer account. Sign in at the store login page to shop.",
      403,
    );
  }
  if (kind === "customer" && !ctx.roles.includes("CUSTOMER")) {
    throw new AppError(
      "WRONG_PORTAL",
      "This is a staff account. Sign in at /admin/login to manage the store.",
      403,
    );
  }
  const token = signToken({
    id: ctx.user.id,
    email: ctx.user.email,
    roles: ctx.roles,
    permissions: ctx.permissions,
    kind,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  return { token, user: publicUser(ctx.user, { roles: ctx.roles }), permissions: ctx.permissions };
}

export async function registerCustomer(input: z.infer<typeof registerSchema>) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw new AppError("EMAIL_TAKEN", "An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const result = await db.insert(users).values({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? null,
  });
  const userId = Number(result[0].insertId);
  const [customerRole] = await db.select().from(roles).where(eq(roles.name, "CUSTOMER")).limit(1);
  if (customerRole) {
    await db.insert(userRoles).values({ userId, roleId: customerRole.id });
  }
  return issueSession(userId, "customer");
}

export async function login(input: z.infer<typeof loginSchema>, kind: "customer" | "admin", ip?: string) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (!user) throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  if (user.status !== "ACTIVE") throw new AppError("ACCOUNT_DISABLED", "This account is not active", 403);
  const session = await issueSession(user.id, kind);
  if (kind === "admin") {
    await audit({ adminUserId: user.id, action: "LOGIN", resource: "auth", resourceId: user.id, ip });
  }
  return session;
}

export async function forgotPassword(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return;
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });
  await sendPasswordResetEmail(user.email, token).catch((err) => {
    console.error("Failed to send password reset email", err);
  });
  return token;
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())),
    )
    .limit(1);
  if (!row) throw new AppError("INVALID_TOKEN", "Reset link is invalid or expired", 400);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
}

export async function getMe(userId: number) {
  const ctx = await loadAuthContext(userId);
  return { ...publicUser(ctx.user, { roles: ctx.roles }), permissions: ctx.permissions };
}

export async function updateProfile(userId: number, input: z.infer<typeof updateProfileSchema>) {
  await db.update(users).set(input).where(eq(users.id, userId));
  return getMe(userId);
}

export async function changePassword(userId: number, input: z.infer<typeof changePasswordSchema>) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);
  const match = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!match) throw new AppError("INVALID_PASSWORD", "Current password is incorrect", 400);
  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
