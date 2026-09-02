import { z } from "zod";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "../../db";
import {
  brands,
  categories,
  inventory,
  productCategories,
  productImages,
  productVariants,
  products,
  reviews,
  users,
} from "../../db/schema";
import { AppError } from "../../utils/http";
import { discountPercent, toMoney } from "../../utils/money";
import { getEditorial } from "./adminMerch.service";
import { cacheGet, cacheSet } from "../../utils/ttlCache";
import { env } from "../../config/env";
import { isOnlinePaymentEnabled } from "../../utils/payments";

export const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  sort: z
    .enum(["relevance", "newest", "price_asc", "price_desc", "rating", "popularity", "discount"])
    .optional()
    .default("relevance"),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(48).optional().default(24),
  featured: z.enum(["true", "false"]).optional(),
  isNew: z.enum(["true", "false"]).optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
});

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  is_featured: number;
  is_new: number;
  gender: "MEN" | "WOMEN" | "UNISEX" | null;
  brand_id: number | null;
  brand_name: string | null;
  brand_slug: string | null;
  variant_id: number;
  sku: string;
  price: string;
  mrp: string;
  available: number;
  avg_rating: string | number | null;
  review_count: number;
  created_at: Date;
};

function mapCard(row: ProductRow, imageUrl: string | null, hoverImageUrl: string | null = null) {
  const price = toMoney(row.price);
  const mrp = toMoney(row.mrp);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand_name ? { id: row.brand_id, name: row.brand_name, slug: row.brand_slug } : null,
    imageUrl,
    hoverImageUrl: hoverImageUrl && hoverImageUrl !== imageUrl ? hoverImageUrl : null,
    variantId: row.variant_id,
    sku: row.sku,
    price,
    mrp,
    discountPercent: discountPercent(mrp, price),
    rating: row.avg_rating ? Number(Number(row.avg_rating).toFixed(1)) : 0,
    reviewCount: Number(row.review_count || 0),
    inStock: Number(row.available) > 0,
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new),
    gender: row.gender ?? "UNISEX",
  };
}

export async function listProducts(raw: z.infer<typeof productQuerySchema>) {
  const query = productQuerySchema.parse(raw);
  const cacheKey = `products:${query.category ?? ""}:${query.brand ?? ""}:${query.q ?? ""}:${query.sort}:${query.page}:${query.limit}:${query.gender ?? ""}:${query.featured ?? ""}:${query.isNew ?? ""}:${query.inStock ?? ""}:${query.minPrice ?? ""}:${query.maxPrice ?? ""}:${query.minRating ?? ""}`;
  const cached = cacheGet<Awaited<ReturnType<typeof queryProducts>>>(cacheKey);
  if (cached) return cached;
  const data = await queryProducts(query);
  cacheSet(cacheKey, data, 20_000);
  return data;
}

async function queryProducts(query: z.infer<typeof productQuerySchema>) {
  const where: string[] = ["p.status = 'PUBLISHED'", "v.is_default = 1", "v.status = 'ACTIVE'", "(p.brand_id IS NULL OR b.status = 'ACTIVE')"];
  const params: unknown[] = [];

  if (query.q) {
    where.push(
      `(p.name LIKE ? OR v.sku LIKE ? OR b.name LIKE ? OR EXISTS (
        SELECT 1 FROM product_categories pc2
        INNER JOIN categories c2 ON c2.id = pc2.category_id
        WHERE pc2.product_id = p.id AND (c2.name LIKE ? OR c2.slug LIKE ?)
      ) OR EXISTS (
        SELECT 1 FROM product_variants vx WHERE vx.product_id = p.id AND vx.sku LIKE ?
      ))`,
    );
    const like = `%${query.q}%`;
    params.push(like, like, like, like, like, like);
  }
  if (query.category) {
    where.push(`EXISTS (
      SELECT 1 FROM product_categories pc
      INNER JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = p.id AND (c.slug = ? OR c.id IN (
        SELECT id FROM categories WHERE parent_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1)
      ))
    )`);
    params.push(query.category, query.category);
  }
  if (query.brand) {
    where.push("(b.slug = ? OR b.name = ?)");
    params.push(query.brand, query.brand);
  }
  if (query.minPrice != null) {
    where.push("v.price >= ?");
    params.push(query.minPrice);
  }
  if (query.maxPrice != null) {
    where.push("v.price <= ?");
    params.push(query.maxPrice);
  }
  if (query.inStock === "true") {
    where.push("(i.stock - i.reserved_stock) > 0");
  }
  if (query.inStock === "false") {
    where.push("(i.stock - i.reserved_stock) <= 0");
  }
  if (query.featured === "true") where.push("p.is_featured = 1");
  if (query.isNew === "true") where.push("p.is_new = 1");
  if (query.gender) {
    where.push("(p.gender = ? OR p.gender = 'UNISEX')");
    params.push(query.gender);
  }
  if (query.minRating != null) {
    where.push(`(
      SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.status = 'APPROVED'
    ) >= ?`);
    params.push(query.minRating);
  }

  const orderBy =
    query.sort === "newest"
      ? "p.created_at DESC"
      : query.sort === "price_asc"
        ? "v.price ASC"
        : query.sort === "price_desc"
          ? "v.price DESC"
          : query.sort === "rating"
            ? "avg_rating DESC"
            : query.sort === "popularity"
              ? "sold DESC"
              : query.sort === "discount"
                ? "((v.mrp - v.price) / NULLIF(v.mrp, 0)) DESC"
                : "p.is_featured DESC, p.created_at DESC";

  const whereSql = where.join(" AND ");
  const offset = (query.page - 1) * query.limit;
  const needsSold = query.sort === "popularity";

  const countSql = `
    SELECT COUNT(*) AS total
    FROM products p
    INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
    INNER JOIN inventory i ON i.variant_id = v.id
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE ${whereSql}
  `;
  const listSql = `
    SELECT p.id, p.name, p.slug, p.status, p.is_featured, p.is_new, p.gender, p.created_at,
           p.brand_id, b.name AS brand_name, b.slug AS brand_slug,
           v.id AS variant_id, v.sku, v.price, v.mrp,
           (i.stock - i.reserved_stock) AS available,
           COALESCE(rv.avg_rating, 0) AS avg_rating,
           COALESCE(rv.review_count, 0) AS review_count
           ${needsSold ? ", COALESCE(sold.qty, 0) AS sold" : ", 0 AS sold"}
    FROM products p
    INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
    INNER JOIN inventory i ON i.variant_id = v.id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN (
      SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
      FROM reviews WHERE status = 'APPROVED' GROUP BY product_id
    ) rv ON rv.product_id = p.id
    ${
      needsSold
        ? `LEFT JOIN (
      SELECT product_id, SUM(quantity) AS qty FROM order_items GROUP BY product_id
    ) sold ON sold.product_id = p.id`
        : ""
    }
    WHERE ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const [[countRows], [rows]] = await Promise.all([
    pool.query(countSql, params),
    pool.query(listSql, [...params, query.limit, offset]),
  ]);
  const total = Number((countRows as Array<{ total: number }>)[0]?.total ?? 0);
  const list = rows as ProductRow[];
  const ids = list.map((r) => r.id);
  const images = ids.length
    ? await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
    : [];
  const imageMap = new Map<number, string>();
  const hoverMap = new Map<number, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
    else if (!hoverMap.has(img.productId) && img.url !== imageMap.get(img.productId)) {
      hoverMap.set(img.productId, img.url);
    }
  }
  return {
    items: list.map((row) => mapCard(row, imageMap.get(row.id) ?? null, hoverMap.get(row.id) ?? null)),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit) || 1,
  };
}

export async function searchSuggest(q: string) {
  if (!q.trim()) return { products: [], categories: [], brands: [] };
  const like = `%${q.trim()}%`;
  const [productRows] = await pool.query(
    `SELECT p.name, p.slug, v.sku, b.name AS brand
     FROM products p
     INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE p.status = 'PUBLISHED'
       AND (p.brand_id IS NULL OR b.status = 'ACTIVE')
       AND (
         p.name LIKE ?
         OR v.sku LIKE ?
         OR b.name LIKE ?
         OR EXISTS (
           SELECT 1 FROM product_variants vx
           WHERE vx.product_id = p.id AND vx.sku LIKE ?
         )
       )
     LIMIT 8`,
    [like, like, like, like],
  );
  const cats = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .where(and(eq(categories.status, "ACTIVE"), sql`${categories.name} LIKE ${like}`))
    .limit(5);
  const brs = await db
    .select({ name: brands.name, slug: brands.slug })
    .from(brands)
    .where(and(eq(brands.status, "ACTIVE"), sql`${brands.name} LIKE ${like}`))
    .limit(5);
  return { products: productRows, categories: cats, brands: brs };
}

const brandCardColumns = {
  id: brands.id,
  name: brands.name,
  slug: brands.slug,
  status: brands.status,
} as const;

export async function getProductBySlug(slug: string, opts: { lite?: boolean } = {}) {
  const cacheKey = `product:${slug}:${opts.lite ? "lite" : "full"}`;
  const cached = cacheGet<Awaited<ReturnType<typeof loadProductBySlug>>>(cacheKey);
  if (cached) return cached;
  const data = await loadProductBySlug(slug, opts);
  cacheSet(cacheKey, data, opts.lite ? 45_000 : 20_000);
  return data;
}

async function loadProductBySlug(slug: string, opts: { lite?: boolean }) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product || product.status !== "PUBLISHED") {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }

  const [brand, cats, variants, images, reviewRows] = await Promise.all([
    product.brandId
      ? db
          .select(brandCardColumns)
          .from(brands)
          .where(eq(brands.id, product.brandId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, product.id)),
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        name: productVariants.name,
        attributes: productVariants.attributes,
        price: productVariants.price,
        mrp: productVariants.mrp,
        isDefault: productVariants.isDefault,
        stock: inventory.stock,
        reservedStock: inventory.reservedStock,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.status, "ACTIVE"))),
    db
      .select({
        id: productImages.id,
        url: productImages.url,
        isPrimary: productImages.isPrimary,
        variantId: productImages.variantId,
        alt: productImages.alt,
      })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder)),
    opts.lite
      ? Promise.resolve([])
      : db
          .select({
            id: reviews.id,
            rating: reviews.rating,
            title: reviews.title,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(reviews)
          .innerJoin(users, eq(reviews.userId, users.id))
          .where(and(eq(reviews.productId, product.id), eq(reviews.status, "APPROVED")))
          .orderBy(desc(reviews.createdAt))
          .limit(20),
  ]);

  if (brand && brand.status !== "ACTIVE") {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }

  const avgRating =
    reviewRows.length === 0 ? 0 : reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length;

  return {
    ...product,
    brand: brand ?? null,
    categories: cats,
    variants: variants.map((v) => {
      const price = toMoney(v.price);
      const mrp = toMoney(v.mrp);
      const available = Math.max(0, Number(v.stock ?? 0) - Number(v.reservedStock ?? 0));
      return {
        ...v,
        price,
        mrp,
        discountPercent: discountPercent(mrp, price),
        stock: Number(v.stock ?? 0),
        reservedStock: Number(v.reservedStock ?? 0),
        available,
        inStock: available > 0,
      };
    }),
    images,
    rating: Number(avgRating.toFixed(1)),
    reviewCount: reviewRows.length,
    reviews: reviewRows,
    related: [] as Awaited<ReturnType<typeof listProducts>>["items"],
  };
}

export async function listCategoriesTree() {
  const cached = cacheGet<Awaited<ReturnType<typeof loadCategoriesTree>>>("categories");
  if (cached) return cached;
  const data = await loadCategoriesTree();
  cacheSet("categories", data, 60_000);
  return data;
}

async function loadCategoriesTree() {
  const all = await db.select().from(categories).where(eq(categories.status, "ACTIVE")).orderBy(asc(categories.sortOrder));
  const byParent = new Map<number | null, typeof all>();
  for (const c of all) {
    const key = c.parentId;
    const arr = byParent.get(key) ?? [];
    arr.push(c);
    byParent.set(key, arr);
  }
  type TreeNode = (typeof all)[number] & { children: TreeNode[] };
  const nest = (parentId: number | null): TreeNode[] =>
    (byParent.get(parentId) ?? []).map((c) => ({ ...c, children: nest(c.id) }));
  return nest(null);
}

export async function listBrands() {
  const cached = cacheGet<Awaited<ReturnType<typeof loadBrands>>>("brands");
  if (cached) return cached;
  const data = await loadBrands();
  cacheSet("brands", data, 60_000);
  return data;
}

async function loadBrands() {
  return db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logoUrl: brands.logoUrl,
      status: brands.status,
    })
    .from(brands)
    .where(eq(brands.status, "ACTIVE"))
    .orderBy(asc(brands.name));
}

export async function getCategoryBySlug(slug: string) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat || cat.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Category not found", 404);
  const children = await db.select().from(categories).where(eq(categories.parentId, cat.id));
  return { ...cat, children: children.filter((c) => c.status === "ACTIVE") };
}

export async function homepageData() {
  const cached = cacheGet<Awaited<ReturnType<typeof loadHomepage>>>("homepage");
  if (cached) return cached;
  const data = await loadHomepage();
  cacheSet("homepage", data, 45_000);
  return data;
}

async function loadHomepage() {
  const [tree, featured, lookbookRows, editorial] = await Promise.all([
    listCategoriesTree(),
    listProducts({ featured: "true", page: 1, limit: 8, sort: "newest" }),
    pool
      .query(
        `SELECT id, slug, title, cover_image_url AS coverImageUrl, video_url AS videoUrl
         FROM lookbooks WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 8`,
      )
      .then(([rows]) => rows as Array<{ id: number; slug: string; title: string; coverImageUrl: string | null; videoUrl: string | null }>)
      .catch(() => [] as Array<{ id: number; slug: string; title: string; coverImageUrl: string | null; videoUrl: string | null }>),
    getEditorial().catch(() => null),
  ]);
  return {
    categories: tree,
    reviews: [],
    featured: featured.items,
    newest: featured.items,
    lookbooks: lookbookRows,
    editorial,
    commerce: storefrontCommerce(),
  };
}

export function storefrontCommerce() {
  const online = isOnlinePaymentEnabled();
  return {
    currency: "MYR",
    payments: [
      {
        id: "COD" as const,
        available: true,
        label: "Cash on delivery",
        note: "Pay in cash when your order arrives. Available on every order.",
      },
      {
        id: "ONLINE" as const,
        available: online,
        label: "Pay online",
        note: online
          ? "Cards, UPI, and netbanking at checkout."
          : "Choose pay online at checkout when the gateway is enabled. Cash on delivery is always available.",
      },
    ],
    shipping: {
      eta: "2–5 business days",
      dispatch: "24–48 hours",
      freeOver: env.FREE_SHIPPING_MIN,
      flat: env.SHIPPING_FLAT,
      note: "Tracked dispatch worldwide. Remote areas may take a little longer.",
    },
    returns: {
      days: 7,
      note: "Unused items with tags attached. Start a return from your order page.",
    },
    packaging: "Premium packaging on every order.",
  };
}
