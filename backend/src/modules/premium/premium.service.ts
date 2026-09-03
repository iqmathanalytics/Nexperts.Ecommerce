import { randomBytes } from "crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, pool } from "../../db";
import {
  addresses,
  brands,
  cartItems,
  carts,
  collectionProducts,
  collections,
  consentRecords,
  lookbookItems,
  lookbooks,
  loyaltyAccounts,
  loyaltyTransactions,
  orderTrackingEvents,
  orders,
  productFitStats,
  productPresence,
  products,
  referrals,
  reviews,
  savedOutfitItems,
  savedOutfits,
  stylePreferences,
  ugcPhotos,
  users,
  waitlistEntries,
  newsletterSubscribers,
} from "../../db/schema";
import { AppError } from "../../utils/http";
import { listProducts } from "../catalog/catalog.service";

async function resolveProductId(idOrSlug: string) {
  const isNum = /^\d+$/.test(idOrSlug);
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(isNum ? eq(products.id, Number(idOrSlug)) : eq(products.slug, idOrSlug))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Product not found", 404);
  return row.id;
}

function lev(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export async function featuredProducts() {
  const data = await listProducts({ featured: "true", page: 1, limit: 8, sort: "newest" });
  return data.items.length ? data.items : (await listProducts({ page: 1, limit: 12, sort: "popularity" })).items;
}

export async function facetedSearch(query: Record<string, unknown>) {
  const q = String(query.q ?? "").trim();
  const data = await listProducts({
    q: q || undefined,
    category: query.category ? String(query.category) : undefined,
    brand: query.brand ? String(query.brand) : undefined,
    minPrice: query.minPrice ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    gender: query.gender as "MEN" | "WOMEN" | "UNISEX" | undefined,
    sort: (query.sort as "relevance") ?? "relevance",
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 24),
  });

  let suggestedCorrection: string | null = null;
  if (q && data.items.length === 0) {
    const [names] = await pool.query("SELECT name FROM products WHERE status = 'PUBLISHED' LIMIT 200");
    let best: { name: string; d: number } | null = null;
    for (const row of names as Array<{ name: string }>) {
      const d = lev(q.toLowerCase(), row.name.toLowerCase().slice(0, q.length + 4));
      if (!best || d < best.d) best = { name: row.name, d };
    }
    if (best && best.d > 0 && best.d <= 3) suggestedCorrection = best.name;
  }

  const [brandFacets] = await pool.query(
    `SELECT b.name, b.slug, COUNT(DISTINCT p.id) AS count
     FROM products p INNER JOIN brands b ON b.id = p.brand_id
     WHERE p.status = 'PUBLISHED' AND b.status = 'ACTIVE'
     GROUP BY b.id ORDER BY count DESC LIMIT 20`,
  );

  return {
    products: data.items,
    facets: { brands: brandFacets },
    suggestedCorrection,
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  };
}

export async function recommendations(idOrSlug: string) {
  const isNum = /^\d+$/.test(idOrSlug);
  const [rows] = await pool.query(
    `SELECT p.id, p.brand_id, b.slug AS brand_slug, (
       SELECT c.slug FROM product_categories pc
       INNER JOIN categories c ON c.id = pc.category_id
       WHERE pc.product_id = p.id LIMIT 1
     ) AS category_slug
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.status = 'PUBLISHED' AND ${isNum ? "p.id = ?" : "p.slug = ?"} LIMIT 1`,
    [idOrSlug],
  );
  const product = (rows as Array<{ id: number; brand_id: number | null; brand_slug: string | null; category_slug: string | null }>)[0];
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);

  const byCategory = product.category_slug
    ? await listProducts({ category: product.category_slug, page: 1, limit: 8, sort: "popularity" })
    : { items: [] as Awaited<ReturnType<typeof listProducts>>["items"] };
  const byBrand = product.brand_slug
    ? await listProducts({ brand: product.brand_slug, page: 1, limit: 8, sort: "newest" })
    : { items: [] as typeof byCategory.items };

  const merged = [...byCategory.items, ...byBrand.items]
    .filter((p, i, arr) => p.id !== product.id && arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 8);
  if (merged.length < 4) {
    const fallback = await featuredProducts();
    for (const p of fallback) {
      if (merged.length >= 8) break;
      if (p.id !== product.id && !merged.some((m) => m.id === p.id)) merged.push(p);
    }
  }
  return merged;
}

export async function designerCollection(slug: string) {
  const [brand] = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      status: brands.status,
      logoUrl: brands.logoUrl,
      heroImageUrl: brands.heroImageUrl,
      lookbookBio: brands.lookbookBio,
    })
    .from(brands)
    .where(eq(brands.slug, slug))
    .limit(1);
  if (!brand || brand.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Designer not found", 404);
  const productData = await listProducts({ brand: slug, page: 1, limit: 48, sort: "newest" });
  const lbs = await db
    .select()
    .from(lookbooks)
    .where(and(eq(lookbooks.brandId, brand.id), eq(lookbooks.status, "ACTIVE")))
    .orderBy(desc(lookbooks.createdAt));
  return {
    brand: {
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      heroImageUrl: brand.heroImageUrl,
      lookbookBio: brand.lookbookBio,
    },
    products: productData.items,
    lookbooks: lbs.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      coverImageUrl: l.coverImageUrl,
    })),
  };
}

export async function seasonalCollection(season: string) {
  const s = season.toLowerCase() as "spring" | "summer" | "festive" | "winter" | "all";
  try {
    const [col] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.season, s), eq(collections.status, "ACTIVE")))
      .limit(1);
    if (!col) {
      const fallback = await listProducts({ page: 1, limit: 24, sort: "newest", isNew: "true" });
      return { name: `${season} edit`, description: `Curated ${season} pieces`, imageUrl: null, products: fallback.items };
    }
    const links = await db
      .select()
      .from(collectionProducts)
      .where(eq(collectionProducts.collectionId, col.id))
      .orderBy(asc(collectionProducts.sortOrder));
    const all = await listProducts({ page: 1, limit: 48, sort: "newest" });
    const idSet = new Set(links.map((l) => l.productId));
    const productsList = idSet.size ? all.items.filter((p) => idSet.has(p.id)) : all.items;
    return { name: col.name, description: col.description, imageUrl: col.imageUrl ?? null, products: productsList };
  } catch {
    const fallback = await listProducts({ page: 1, limit: 24, sort: "newest" });
    return { name: `${season} edit`, description: `Curated ${season} pieces`, imageUrl: null, products: fallback.items };
  }
}

export async function listLookbooks() {
  const rows = await db.select().from(lookbooks).where(eq(lookbooks.status, "ACTIVE")).orderBy(desc(lookbooks.createdAt)).limit(12);
  return rows.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    coverImageUrl: l.coverImageUrl,
    videoUrl: l.videoUrl,
  }));
}

export async function getLookbook(slug: string) {
  const [lb] = await db.select().from(lookbooks).where(eq(lookbooks.slug, slug)).limit(1);
  if (!lb || lb.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Lookbook not found", 404);
  const items = await db.select().from(lookbookItems).where(eq(lookbookItems.lookbookId, lb.id)).orderBy(lookbookItems.sortOrder);
  const cards = await listProducts({ page: 1, limit: 48, sort: "newest" });
  const byId = new Map(cards.items.map((p) => [p.id, p]));
  return {
    title: lb.title,
    description: lb.description,
    coverImageUrl: lb.coverImageUrl,
    videoUrl: lb.videoUrl,
    items: items
      .map((i) => {
        const p = byId.get(i.productId);
        if (!p) return null;
        return {
          productId: p.id,
          name: p.name,
          slug: p.slug,
          imageUrl: p.imageUrl,
          price: p.price,
          hotspotX: i.hotspotX ? Number(i.hotspotX) : null,
          hotspotY: i.hotspotY ? Number(i.hotspotY) : null,
        };
      })
      .filter(Boolean),
  };
}

export async function visualSearch(_input: { imageUrl?: string }) {
  const products = await featuredProducts();
  return { products: products.slice(0, 8), note: "Visual match MVP — showing similar featured pieces" };
}

export const styleQuizSchema = z.object({
  preferredSize: z.string().optional(),
  lengthDeltaCm: z.coerce.number().optional().default(0),
  fitPreference: z.enum(["slim", "regular", "oversized"]).optional().default("regular"),
  quizAnswers: z.record(z.string(), z.unknown()).optional(),
});

export async function saveStyleQuiz(userId: number, input: z.infer<typeof styleQuizSchema>) {
  const existing = await db.select().from(stylePreferences).where(eq(stylePreferences.userId, userId)).limit(1);
  if (existing[0]) {
    await db
      .update(stylePreferences)
      .set({
        preferredSize: input.preferredSize,
        lengthDeltaCm: input.lengthDeltaCm,
        fitPreference: input.fitPreference,
        quizAnswers: input.quizAnswers,
      })
      .where(eq(stylePreferences.userId, userId));
  } else {
    await db.insert(stylePreferences).values({
      userId,
      preferredSize: input.preferredSize,
      lengthDeltaCm: input.lengthDeltaCm ?? 0,
      fitPreference: input.fitPreference ?? "regular",
      quizAnswers: input.quizAnswers,
    });
  }
  return { ok: true };
}

export async function userRecommendations(userId: number) {
  const [prefs] = await db.select().from(stylePreferences).where(eq(stylePreferences.userId, userId)).limit(1);
  const gender =
    prefs?.quizAnswers && typeof prefs.quizAnswers === "object" && "occasion" in (prefs.quizAnswers as object)
      ? undefined
      : undefined;
  const data = await listProducts({ page: 1, limit: 12, sort: "popularity", gender });
  return { products: data.items, prefs: prefs ?? null };
}

export const outfitSchema = z.object({
  name: z.string().min(1).max(150),
  items: z
    .array(
      z.object({
        productId: z.number(),
        variantId: z.number().optional().nullable(),
        sortOrder: z.number().optional(),
      }),
    )
    .min(1)
    .max(12),
});

export async function createOutfit(userId: number, input: z.infer<typeof outfitSchema>) {
  const shareSlug = `look-${randomBytes(4).toString("hex")}`;
  const result = await db.insert(savedOutfits).values({ userId, name: input.name, shareSlug });
  const outfitId = Number((result as unknown as { insertId?: number }).insertId ?? (result as { [k: number]: { insertId: number } })[0]?.insertId);
  // drizzle mysql insert returns ResultSetHeader differently
  const [created] = await db.select().from(savedOutfits).where(eq(savedOutfits.shareSlug, shareSlug)).limit(1);
  if (!created) throw new AppError("SERVER_ERROR", "Could not save outfit", 500);
  for (const [i, item] of input.items.entries()) {
    await db.insert(savedOutfitItems).values({
      outfitId: created.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      sortOrder: item.sortOrder ?? i,
    });
  }
  return created;
}

export async function listOutfits(userId: number) {
  return db.select().from(savedOutfits).where(eq(savedOutfits.userId, userId)).orderBy(desc(savedOutfits.createdAt));
}

async function ensureLoyalty(userId: number) {
  const [acc] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId)).limit(1);
  if (acc) return acc;
  await db.insert(loyaltyAccounts).values({ userId, balance: 200 });
  const [created] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId)).limit(1);
  if (created) {
    await db.insert(loyaltyTransactions).values({
      accountId: created.id,
      points: 200,
      type: "EARN",
      reason: "Welcome bonus",
    });
  }
  return created!;
}

export async function getLoyalty(userId: number) {
  const acc = await ensureLoyalty(userId);
  const transactions = await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.accountId, acc.id))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(20);
  return { balance: acc.balance, transactions };
}

export async function redeemLoyalty(userId: number, points: number) {
  if (points < 100 || points % 100 !== 0) throw new AppError("VALIDATION", "Redeem in multiples of 100 points", 400);
  const acc = await ensureLoyalty(userId);
  if (acc.balance < points) throw new AppError("INSUFFICIENT", "Not enough points", 400);
  // 100 points = RM 10
  const discountAmount = (points / 100) * 10;
  await db.update(loyaltyAccounts).set({ balance: acc.balance - points }).where(eq(loyaltyAccounts.id, acc.id));
  await db.insert(loyaltyTransactions).values({
    accountId: acc.id,
    points: -points,
    type: "REDEEM",
    reason: `Redeemed for RM ${discountAmount} off`,
  });
  return { discountAmount, balance: acc.balance - points, couponHint: `LOYALTY${points}` };
}

export async function shippingEstimate(pincode: string) {
  const east = /^(8[8-9]|9[0-8])/.test(pincode);
  const klValley = /^(4[0-8]|5[0-9]|6[0-8])/.test(pincode);
  const days = east ? 5 : klValley ? 2 : 3;
  const eta = new Date();
  eta.setDate(eta.getDate() + days);
  return {
    pincode,
    warehouses: [
      { id: "WH-01", name: "Primary Hub", etaDate: eta.toISOString().slice(0, 10), businessDays: days },
      {
        id: "WH-02",
        name: "Secondary Hub",
        etaDate: new Date(Date.now() + (days + 1) * 86400000).toISOString().slice(0, 10),
        businessDays: days + 1,
      },
    ],
  };
}

export async function orderTracking(userId: number, orderId: number) {
  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  const events = await db
    .select()
    .from(orderTrackingEvents)
    .where(eq(orderTrackingEvents.orderId, orderId))
    .orderBy(desc(orderTrackingEvents.createdAt));
  return { order: { id: order.id, orderNumber: order.orderNumber, status: order.status }, events };
}

export async function trackingWebhook(input: { orderId: number; status: string; message?: string }) {
  await db.insert(orderTrackingEvents).values({
    orderId: input.orderId,
    status: input.status,
    message: input.message,
  });
  return { ok: true };
}

export async function fitData(idOrSlug: string) {
  const productId = await resolveProductId(idOrSlug);
  const [stats] = await db.select().from(productFitStats).where(eq(productFitStats.productId, productId)).limit(1);
  const small = stats?.smallCount ?? 0;
  const trueC = stats?.trueCount ?? 0;
  const large = stats?.largeCount ?? 0;
  const total = small + trueC + large;
  let label = "True to size";
  if (total > 0) {
    if (small >= trueC && small >= large) label = "Runs small";
    else if (large >= trueC && large >= small) label = "Runs large";
  }
  return { small, true: trueC, large, label, total };
}

export async function bumpPresence(idOrSlug: string) {
  const productId = await resolveProductId(idOrSlug);
  const [row] = await db.select().from(productPresence).where(eq(productPresence.productId, productId)).limit(1);
  if (row) {
    const viewers = Math.min(99, row.viewers + Math.floor(Math.random() * 2) + 1);
    await db.update(productPresence).set({ viewers }).where(eq(productPresence.productId, productId));
    return { viewers };
  }
  const viewers = 3 + Math.floor(Math.random() * 8);
  await db.insert(productPresence).values({ productId, viewers });
  return { viewers };
}

export async function getPresence(idOrSlug: string) {
  const productId = await resolveProductId(idOrSlug);
  const [row] = await db.select().from(productPresence).where(eq(productPresence.productId, productId)).limit(1);
  return { viewers: row?.viewers ?? 0 };
}

export async function listUgc(idOrSlug: string) {
  const productId = await resolveProductId(idOrSlug);
  const photos = await db
    .select()
    .from(ugcPhotos)
    .where(and(eq(ugcPhotos.productId, productId), eq(ugcPhotos.status, "APPROVED")))
    .limit(24);
  return photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl, caption: p.caption }));
}

export async function addUgc(userId: number, idOrSlug: string, input: { imageUrl: string; caption?: string }) {
  const productId = await resolveProductId(idOrSlug);
  await db.insert(ugcPhotos).values({
    productId,
    userId,
    imageUrl: input.imageUrl,
    caption: input.caption,
    status: "PENDING",
  });
  return { ok: true };
}

export async function joinWaitlist(input: { variantId: number; email: string; phone?: string }) {
  try {
    await db.insert(waitlistEntries).values({
      variantId: input.variantId,
      email: input.email.toLowerCase(),
      phone: input.phone,
    });
  } catch {
    // unique — already joined
  }
  return { ok: true };
}

export async function myReferral(userId: number) {
  const [existing] = await db.select().from(referrals).where(eq(referrals.referrerUserId, userId)).limit(1);
  if (existing) return existing;
  const code = `NX${userId}${randomBytes(2).toString("hex").toUpperCase()}`;
  await db.insert(referrals).values({ referrerUserId: userId, code, rewardAmount: "100.00" });
  const [created] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1);
  return created!;
}

export async function claimReferral(userId: number, code: string) {
  const [ref] = await db.select().from(referrals).where(eq(referrals.code, code.toUpperCase())).limit(1);
  if (!ref || ref.status !== "ACTIVE") throw new AppError("INVALID", "Invalid referral code", 400);
  if (ref.referrerUserId === userId) throw new AppError("INVALID", "Cannot use your own code", 400);
  await db.update(referrals).set({ referredUserId: userId, status: "CLAIMED" }).where(eq(referrals.id, ref.id));
  const acc = await ensureLoyalty(userId);
  await db.update(loyaltyAccounts).set({ balance: acc.balance + 200 }).where(eq(loyaltyAccounts.id, acc.id));
  await db.insert(loyaltyTransactions).values({
    accountId: acc.id,
    points: 200,
    type: "EARN",
    reason: "Referral bonus",
  });
  return { ok: true, pointsEarned: 200 };
}

export async function privacyExport(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const addr = await db.select().from(addresses).where(eq(addresses.userId, userId));
  const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
  const userReviews = await db.select().from(reviews).where(eq(reviews.userId, userId));
  return { user, addresses: addr, orders: userOrders, reviews: userReviews };
}

export async function privacyDelete(userId: number) {
  await db.update(users).set({ status: "DELETED", email: `deleted-${userId}@nexperts.invalid` }).where(eq(users.id, userId));
  return { ok: true };
}

export async function saveConsent(userId: number, type: string, granted: boolean) {
  await db.insert(consentRecords).values({ userId, type, granted });
  return { ok: true };
}

export async function mergeCart(userId: number, items: Array<{ variantId: number; quantity: number }>) {
  let [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart) {
    await db.insert(carts).values({ userId });
    [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  }
  for (const item of items) {
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart!.id), eq(cartItems.variantId, item.variantId)))
      .limit(1);
    if (existing) {
      await db
        .update(cartItems)
        .set({ quantity: existing.quantity + item.quantity })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({ cartId: cart!.id, variantId: item.variantId, quantity: item.quantity });
    }
  }
  return { ok: true };
}

export async function faqChat(question: string) {
  const q = question.toLowerCase();
  if (q.includes("size") || q.includes("fit")) {
    return {
      answer:
        "Use the size guide on the product page. If reviews say it runs small, size up. Complete the style quiz for a saved fit profile.",
    };
  }
  if (q.includes("return")) {
    return { answer: "We offer 7-day returns on unused items with tags. Start from your order details page." };
  }
  if (q.includes("ship") || q.includes("delivery")) {
    return { answer: "Most orders arrive in 2–5 business days. Enter your pincode at checkout for a live estimate." };
  }
  return {
    answer: "For size and order help, WhatsApp us from the footer or open the size guide on any product page.",
  };
}

export async function premiumAnalytics() {
  const [byBrand] = await pool.query(
    `SELECT b.name AS brand, SUM(oi.total) AS revenue, SUM(oi.quantity) AS units
     FROM order_items oi
     INNER JOIN products p ON p.id = oi.product_id
     LEFT JOIN brands b ON b.id = p.brand_id
     INNER JOIN orders o ON o.id = oi.order_id AND o.status != 'CANCELLED'
     GROUP BY b.id ORDER BY revenue DESC LIMIT 10`,
  );
  const [byCategory] = await pool.query(
    `SELECT c.name AS category, SUM(oi.total) AS revenue, SUM(oi.quantity) AS units
     FROM order_items oi
     INNER JOIN product_categories pc ON pc.product_id = oi.product_id
     INNER JOIN categories c ON c.id = pc.category_id
     INNER JOIN orders o ON o.id = oi.order_id AND o.status != 'CANCELLED'
     GROUP BY c.id ORDER BY revenue DESC LIMIT 10`,
  );
  const [wishlisted] = await pool.query(
    `SELECT p.name, p.slug, COUNT(*) AS wishes
     FROM wishlist_items w
     INNER JOIN products p ON p.id = w.product_id
     GROUP BY p.id ORDER BY wishes DESC LIMIT 10`,
  );
  const fitTrends = await db.select().from(productFitStats).limit(20);
  const [funnel] = await pool.query(
    `SELECT event_type, COUNT(*) AS c FROM analytics_events
     GROUP BY event_type ORDER BY c DESC LIMIT 20`,
  );
  const [ltvRows] = await pool.query(
    `SELECT AVG(customer_total) AS avgLtv FROM (
       SELECT user_id, SUM(total) AS customer_total
       FROM orders WHERE status != 'CANCELLED'
       GROUP BY user_id
     ) t`,
  );
  const approximateLtv = Number((ltvRows as Array<{ avgLtv: number | null }>)[0]?.avgLtv ?? 0);
  return {
    revenueByBrand: byBrand,
    revenueByCategory: byCategory,
    mostWishlisted: wishlisted,
    fitTrends,
    funnel,
    approximateLtv,
  };
}

export async function updateFitStats(productId: number, fit: "SMALL" | "TRUE" | "LARGE") {
  const [stats] = await db.select().from(productFitStats).where(eq(productFitStats.productId, productId)).limit(1);
  if (!stats) {
    await db.insert(productFitStats).values({
      productId,
      smallCount: fit === "SMALL" ? 1 : 0,
      trueCount: fit === "TRUE" ? 1 : 0,
      largeCount: fit === "LARGE" ? 1 : 0,
    });
    return;
  }
  await db
    .update(productFitStats)
    .set({
      smallCount: stats.smallCount + (fit === "SMALL" ? 1 : 0),
      trueCount: stats.trueCount + (fit === "TRUE" ? 1 : 0),
      largeCount: stats.largeCount + (fit === "LARGE" ? 1 : 0),
    })
    .where(eq(productFitStats.productId, productId));
}

let newsletterTableReady = false;

async function ensureNewsletterTable() {
  if (newsletterTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      status ENUM('ACTIVE','UNSUBSCRIBED') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY newsletter_email_unique (email)
    )
  `);
  newsletterTableReady = true;
}

export async function subscribeNewsletter(email: string) {
  await ensureNewsletterTable();
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) throw new AppError("VALIDATION", "Enter a valid email", 400);
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, normalized)).limit(1);
  if (existing) {
    if (existing.status !== "ACTIVE") {
      await db.update(newsletterSubscribers).set({ status: "ACTIVE" }).where(eq(newsletterSubscribers.id, existing.id));
    }
    return { email: normalized, alreadySubscribed: true };
  }
  await db.insert(newsletterSubscribers).values({ email: normalized, status: "ACTIVE" });
  return { email: normalized, alreadySubscribed: false };
}
