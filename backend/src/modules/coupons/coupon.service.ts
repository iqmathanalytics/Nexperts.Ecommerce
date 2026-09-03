import { z } from "zod";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "../../db";
import { couponUsage, coupons, orders } from "../../db/schema";
import { AppError } from "../../utils/http";
import { applyCouponDiscount, toMoney } from "../../utils/money";
import { audit } from "../../utils/audit";

/** First-order / welcome codes — once used or after any completed order, hide & block reuse. */
export const FIRST_ORDER_COUPON_CODES = new Set(["WELCOME10"]);

export function isFirstOrderCouponCode(code: string) {
  return FIRST_ORDER_COUPON_CODES.has(code.trim().toUpperCase());
}

export const couponSchema = z.object({
  code: z.string().min(3).max(40).transform((v) => v.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().default(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function listCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function createCoupon(adminId: number, input: z.infer<typeof couponSchema>) {
  const result = await db.insert(coupons).values({
    ...input,
    value: String(input.value),
    minOrderAmount: String(input.minOrderAmount),
    maxDiscount: input.maxDiscount != null ? String(input.maxDiscount) : null,
    status: input.status ?? "ACTIVE",
  });
  const id = Number(result[0].insertId);
  await audit({ adminUserId: adminId, action: "COUPON_CREATED", resource: "coupon", resourceId: id });
  return { id, ...input };
}

export async function updateCoupon(adminId: number, id: number, input: z.infer<typeof couponSchema>) {
  await db
    .update(coupons)
    .set({
      ...input,
      value: String(input.value),
      minOrderAmount: String(input.minOrderAmount),
      maxDiscount: input.maxDiscount != null ? String(input.maxDiscount) : null,
    })
    .where(eq(coupons.id, id));
  await audit({ adminUserId: adminId, action: "COUPON_UPDATED", resource: "coupon", resourceId: id });
}

async function countNonCancelledOrders(userId: number) {
  const rows = await db
    .select({ used: sql<number>`count(*)` })
    .from(orders)
    .where(and(eq(orders.userId, userId), ne(orders.status, "CANCELLED")));
  return Number(rows[0]?.used ?? 0);
}

async function countCouponUses(userId: number, couponId: number) {
  const usageRows = await db
    .select({ used: sql<number>`count(*)` })
    .from(couponUsage)
    .where(and(eq(couponUsage.couponId, couponId), eq(couponUsage.userId, userId)));
  return Number(usageRows[0]?.used ?? 0);
}

/** Storefront: hide WELCOME / first-order promos after claim or first order. */
export async function getFirstOrderOfferEligibility(userId: number) {
  const orderCount = await countNonCancelledOrders(userId);
  const hasCompletedOrder = orderCount > 0;

  let hasClaimedWelcome = false;
  for (const code of FIRST_ORDER_COUPON_CODES) {
    const [coupon] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!coupon) continue;
    if ((await countCouponUses(userId, coupon.id)) > 0) {
      hasClaimedWelcome = true;
      break;
    }
  }

  return {
    eligibleForFirstOrderOffer: !hasCompletedOrder && !hasClaimedWelcome,
    hasCompletedOrder,
    hasClaimedWelcome,
  };
}

async function assertFirstOrderEligible(userId: number, code: string) {
  if (!isFirstOrderCouponCode(code)) return;
  const orderCount = await countNonCancelledOrders(userId);
  if (orderCount > 0) {
    throw new AppError(
      "INVALID_COUPON",
      "This welcome offer is only for your first order",
      400,
    );
  }
}

export async function previewCoupon(userId: number, code: string, subtotal: number) {
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
  if (!coupon) throw new AppError("INVALID_COUPON", "Coupon not found", 400);
  const now = new Date();
  if (coupon.status !== "ACTIVE") throw new AppError("INVALID_COUPON", "Coupon is not active", 400);
  if (now < coupon.startsAt || now > coupon.endsAt) throw new AppError("INVALID_COUPON", "Coupon is expired or not yet valid", 400);
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError("INVALID_COUPON", "Coupon usage limit reached", 400);
  }
  await assertFirstOrderEligible(userId, coupon.code);
  const used = await countCouponUses(userId, coupon.id);
  if (used >= coupon.perUserLimit) throw new AppError("INVALID_COUPON", "You have already used this coupon", 400);
  if (subtotal < toMoney(coupon.minOrderAmount)) {
    throw new AppError("INVALID_COUPON", `Minimum order amount is RM ${coupon.minOrderAmount}`, 400);
  }
  const discount = applyCouponDiscount({
    subtotal,
    type: coupon.type,
    value: toMoney(coupon.value),
    maxDiscount: coupon.maxDiscount ? toMoney(coupon.maxDiscount) : null,
  });
  return { coupon, discount };
}

type CouponRow = RowDataPacket & {
  id: number;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  min_order_amount: string;
  max_discount: string | null;
  starts_at: Date;
  ends_at: Date;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  status: "ACTIVE" | "INACTIVE";
};

export async function lockAndValidateCoupon(conn: PoolConnection, userId: number, code: string, subtotal: number) {
  const [rows] = await conn.query<CouponRow[]>(
    "SELECT * FROM coupons WHERE code = ? FOR UPDATE",
    [code.toUpperCase()],
  );
  const coupon = rows[0];
  if (!coupon) throw new AppError("INVALID_COUPON", "Coupon not found", 400);
  const now = new Date();
  if (coupon.status !== "ACTIVE") throw new AppError("INVALID_COUPON", "Coupon is not active", 400);
  if (now < coupon.starts_at || now > coupon.ends_at) {
    throw new AppError("INVALID_COUPON", "Coupon is expired or not yet valid", 400);
  }
  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) {
    throw new AppError("INVALID_COUPON", "Coupon usage limit reached", 400);
  }
  if (isFirstOrderCouponCode(coupon.code)) {
    const [orderRows] = await conn.query<Array<RowDataPacket & { used: number }>>(
      "SELECT COUNT(*) AS used FROM orders WHERE user_id = ? AND status <> 'CANCELLED'",
      [userId],
    );
    if (Number(orderRows[0]?.used ?? 0) > 0) {
      throw new AppError("INVALID_COUPON", "This welcome offer is only for your first order", 400);
    }
  }
  const [usageRows] = await conn.query<Array<RowDataPacket & { used: number }>>(
    "SELECT COUNT(*) AS used FROM coupon_usage WHERE coupon_id = ? AND user_id = ?",
    [coupon.id, userId],
  );
  if (Number(usageRows[0]?.used ?? 0) >= coupon.per_user_limit) {
    throw new AppError("INVALID_COUPON", "You have already used this coupon", 400);
  }
  if (subtotal < toMoney(coupon.min_order_amount)) {
    throw new AppError("INVALID_COUPON", `Minimum order amount is RM ${coupon.min_order_amount}`, 400);
  }
  const discount = applyCouponDiscount({
    subtotal,
    type: coupon.type,
    value: toMoney(coupon.value),
    maxDiscount: coupon.max_discount ? toMoney(coupon.max_discount) : null,
  });
  return { couponId: coupon.id, discount };
}

export async function recordCouponUsage(
  conn: PoolConnection,
  couponId: number,
  userId: number,
  orderId: number,
  discount: number,
) {
  await conn.query(
    "INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)",
    [couponId, userId, orderId, discount],
  );
  const [result] = await conn.query(
    "UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)",
    [couponId],
  );
  const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
  if (affected === 0) throw new AppError("INVALID_COUPON", "Coupon usage limit reached", 400);
}
