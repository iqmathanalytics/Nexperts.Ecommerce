import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { orderItems, orders, products, reviews, users } from "../../db/schema";
import { AppError } from "../../utils/http";
import { audit } from "../../utils/audit";

export const reviewSchema = z.object({
  productId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(180),
  comment: z.string().min(10).max(2000),
});

export async function listEligibleReviews(userId: number, productId?: number) {
  const deliveredOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "DELIVERED")));
  if (!deliveredOrders.length) return [];

  const orderIds = deliveredOrders.map((o) => o.id);
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
  const orderNumberById = new Map(deliveredOrders.map((o) => [o.id, o.orderNumber]));

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
  if (order.status !== "DELIVERED") {
    throw new AppError("NOT_ELIGIBLE", "You can review after the order is delivered", 400);
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
  const result = await db.insert(reviews).values({ ...input, userId, status: "PENDING", isVerified: true });
  return { id: Number(result[0].insertId), ...input, status: "PENDING" };
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
  const q = db
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
    .orderBy(desc(reviews.createdAt));
  if (status) return q.where(eq(reviews.status, status as "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN"));
  return q;
}

export async function moderateReview(adminId: number, id: number, status: "APPROVED" | "REJECTED" | "HIDDEN") {
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  await audit({ adminUserId: adminId, action: "REVIEW_MODERATED", resource: "review", resourceId: id, metadata: { status } });
}

export async function deleteReview(adminId: number, id: number) {
  await db.delete(reviews).where(eq(reviews.id, id));
  await audit({ adminUserId: adminId, action: "REVIEW_DELETED", resource: "review", resourceId: id });
}
