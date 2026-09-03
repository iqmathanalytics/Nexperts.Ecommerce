import { z } from "zod";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "../../db";
import { orderItems, orders, products, reviews, users } from "../../db/schema";
import { AppError } from "../../utils/http";
import { audit } from "../../utils/audit";
import { invalidateStorefrontCache } from "../../utils/ttlCache";

const REVIEWABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] as const;

export const reviewSchema = z.object({
  productId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(180),
  comment: z.string().min(10).max(2000),
  fitFeedback: z.enum(["SMALL", "TRUE", "LARGE"]).optional(),
});

export const moderateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "HIDDEN"]),
});

export async function listEligibleReviews(userId: number, productId?: number) {
  const purchasedOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status })
    .from(orders)
    .where(and(eq(orders.userId, userId), ne(orders.status, "CANCELLED")));
  const reviewable = purchasedOrders.filter((o) =>
    REVIEWABLE_STATUSES.includes(o.status as (typeof REVIEWABLE_STATUSES)[number]),
  );
  if (!reviewable.length) return [];

  const orderIds = reviewable.map((o) => o.id);
  const itemFilters = [inArray(orderItems.orderId, orderIds)];
  if (productId) itemFilters.push(eq(orderItems.productId, productId));

  const items = await db
    .select({
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      productName: orderItems.productName,
    })
    .from(orderItems)
    .where(and(...itemFilters));

  const existingReviews = await db
    .select({ orderId: reviews.orderId, productId: reviews.productId })
    .from(reviews)
    .where(eq(reviews.userId, userId));
  const reviewed = new Set(existingReviews.map((r) => `${r.orderId}-${r.productId}`));

  const productIds = [...new Set(items.map((i) => i.productId))];
  const productRows = productIds.length
    ? await db.select({ id: products.id, slug: products.slug }).from(products).where(inArray(products.id, productIds))
    : [];
  const slugById = new Map(productRows.map((p) => [p.id, p.slug]));
  const orderNumberById = new Map(reviewable.map((o) => [o.id, o.orderNumber]));

  return items
    .filter((i) => !reviewed.has(`${i.orderId}-${i.productId}`))
    .map((i) => ({
      orderId: i.orderId,
      orderNumber: orderNumberById.get(i.orderId) ?? `Order #${i.orderId}`,
      productId: i.productId,
      productName: i.productName,
      productSlug: slugById.get(i.productId) ?? null,
    }));
}

export async function createReview(userId: number, input: z.infer<typeof reviewSchema>) {
  const [order] = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.userId, userId))).limit(1);
  if (!order) throw new AppError("FORBIDDEN", "You can only review products you purchased", 403);
  if (order.status === "CANCELLED" || !REVIEWABLE_STATUSES.includes(order.status as (typeof REVIEWABLE_STATUSES)[number])) {
    throw new AppError("NOT_ELIGIBLE", "This order cannot be reviewed", 400);
  }
  const [item] = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, input.orderId), eq(orderItems.productId, input.productId)))
    .limit(1);
  if (!item) throw new AppError("FORBIDDEN", "This product was not in the selected order", 403);
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, input.productId), eq(reviews.orderId, input.orderId)))
    .limit(1);
  if (existing) throw new AppError("ALREADY_REVIEWED", "You already reviewed this product for this order", 409);
  const result = await db.insert(reviews).values({
    productId: input.productId,
    orderId: input.orderId,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    fitFeedback: input.fitFeedback,
    userId,
    status: "APPROVED",
    isVerified: true,
  });
  if (input.fitFeedback) {
    const { updateFitStats } = await import("../premium/premium.service.js");
    await updateFitStats(input.productId, input.fitFeedback);
  }
  invalidateStorefrontCache();
  return { id: Number(result[0].insertId), ...input, status: "APPROVED" as const };
}

export async function listMyReviews(userId: number) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      status: reviews.status,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function adminListReviews(status?: string) {
  const allowed = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"] as const;
  const filter = allowed.includes(status as (typeof allowed)[number])
    ? eq(reviews.status, status as (typeof allowed)[number])
    : undefined;
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      status: reviews.status,
      isVerified: reviews.isVerified,
      createdAt: reviews.createdAt,
      productName: products.name,
      productId: reviews.productId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(filter ?? sql`1=1`)
    .orderBy(desc(reviews.createdAt));
}

export async function moderateReview(adminId: number, id: number, status: "APPROVED" | "REJECTED" | "HIDDEN") {
  const [row] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Review not found", 404);
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  invalidateStorefrontCache();
  await audit({ adminUserId: adminId, action: "REVIEW_MODERATED", resource: "review", resourceId: id, metadata: { status } });
  return { ...row, status };
}

export async function deleteReview(adminId: number, id: number) {
  const [row] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Review not found", 404);
  await db.delete(reviews).where(eq(reviews.id, id));
  invalidateStorefrontCache();
  await audit({ adminUserId: adminId, action: "REVIEW_DELETED", resource: "review", resourceId: id });
}
