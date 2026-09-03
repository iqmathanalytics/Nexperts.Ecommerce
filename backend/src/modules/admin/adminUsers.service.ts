import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db, pool } from "../../db";
import { addresses, reviews, roles, userRoles, users, wishlistItems, wishlists } from "../../db/schema";
import { AppError } from "../../utils/http";
import { audit } from "../../utils/audit";
import bcrypt from "bcryptjs";

export async function listCustomers(q?: string, page = 1, limit = 20, status?: string) {
  const like = q ? `%${q}%` : null;
  let where = like
    ? "AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ?)"
    : "";
  const params: unknown[] = like ? [like, like, like, like] : [];
  if (status === "ACTIVE" || status === "SUSPENDED") {
    where += " AND u.status = ?";
    params.push(status);
  }
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id AND r.name = 'CUSTOMER'
     WHERE 1=1 ${where}`,
    params,
  );
  const [rows] = await pool.query(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, u.created_at AS createdAt,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS totalOrders,
            (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id AND o.status != 'CANCELLED') AS totalSpending,
            (SELECT MAX(created_at) FROM orders o WHERE o.user_id = u.id) AS lastOrder
     FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id AND r.name = 'CUSTOMER'
     WHERE 1=1 ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  return { items: rows, total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0), page, limit };
}

export async function getCustomer(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new AppError("NOT_FOUND", "Customer not found", 404);
  const addr = await db.select().from(addresses).where(eq(addresses.userId, id));
  const revs = await db.select().from(reviews).where(eq(reviews.userId, id));
  const [wl] = await db.select().from(wishlists).where(eq(wishlists.userId, id)).limit(1);
  const wish = wl ? await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, wl.id)) : [];
  const [orderRows] = await pool.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [id]);
  const { passwordHash: _pw, ...safe } = user;
  return { ...safe, addresses: addr, reviews: revs, wishlist: wish, orders: orderRows };
}

export async function updateCustomerStatus(adminId: number, id: number, status: "ACTIVE" | "SUSPENDED") {
  await db.update(users).set({ status }).where(eq(users.id, id));
  await audit({ adminUserId: adminId, action: "CUSTOMER_UPDATED", resource: "customer", resourceId: id, metadata: { status } });
}

export const adminUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().max(100).default(""),
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "INVENTORY_MANAGER", "ORDER_MANAGER", "ANALYST"]),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export async function listAdminUsers() {
  const [rows] = await pool.query(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.status, r.name AS role
     FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE r.name != 'CUSTOMER'
     ORDER BY u.created_at DESC`,
  );
  return rows;
}

export async function createAdminUser(adminId: number, input: z.infer<typeof adminUserSchema>) {
  const passwordHash = await bcrypt.hash(input.password ?? "ChangeMe@123", 12);
  const result = await db.insert(users).values({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
    status: input.status ?? "ACTIVE",
  });
  const userId = Number(result[0].insertId);
  const [role] = await db.select().from(roles).where(eq(roles.name, input.role)).limit(1);
  if (role) await db.insert(userRoles).values({ userId, roleId: role.id });
  await audit({ adminUserId: adminId, action: "USER_CREATED", resource: "user", resourceId: userId });
  return { id: userId, ...input, password: undefined };
}

export async function updateAdminUser(adminId: number, id: number, input: z.infer<typeof adminUserSchema>) {
  await db
    .update(users)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      status: input.status ?? "ACTIVE",
    })
    .where(eq(users.id, id));
  if (input.password) {
    await db.update(users).set({ passwordHash: await bcrypt.hash(input.password, 12) }).where(eq(users.id, id));
  }
  const [role] = await db.select().from(roles).where(eq(roles.name, input.role)).limit(1);
  if (role) {
    await db.delete(userRoles).where(eq(userRoles.userId, id));
    await db.insert(userRoles).values({ userId: id, roleId: role.id });
  }
  await audit({ adminUserId: adminId, action: "USER_UPDATED", resource: "user", resourceId: id });
}

export async function listAuditLogs(page = 1, limit = 50) {
  const [rows] = await pool.query(
    `SELECT a.*, u.email AS adminEmail
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.admin_user_id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, (page - 1) * limit],
  );
  return rows;
}
