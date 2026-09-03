import { z } from "zod";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  brands,
  collectionProducts,
  collections,
  lookbookItems,
  lookbooks,
  products,
  settings,
} from "../../db/schema";
import { AppError } from "../../utils/http";
import { toSlug, uniqueSuffix } from "../../utils/slug";
import { audit } from "../../utils/audit";
import { DEFAULT_EDITORIAL, mergeEditorial, type StorefrontEditorial } from "./editorialDefaults";
import { cacheGet, cacheSet, invalidateStorefrontCache } from "../../utils/ttlCache";

const EDITORIAL_KEY = "storefront.editorial";

const tileSchema = z.object({
  href: z.string().min(1).max(400),
  label: z.string().min(1).max(120),
  title: z.string().max(180).optional(),
  cta: z.string().max(80).optional(),
  image: z.string().min(1).max(800),
  alt: z.string().max(180).optional(),
});

export const editorialSchema = z.object({
  homeHeadline: z.string().max(400).optional(),
  homeSubhead: z.string().max(800).optional(),
  womenHeadline: z.string().max(180).optional(),
  womenSubhead: z.string().max(400).optional(),
  menHeadline: z.string().max(180).optional(),
  menSubhead: z.string().max(400).optional(),
  heroSlides: z.array(z.object({ src: z.string().min(1).max(800), alt: z.string().max(180), caption: z.string().max(180) })).optional(),
  campaigns: z.array(tileSchema).optional(),
  dressEdits: z.array(tileSchema).optional(),
  womenHero: z.string().max(800).optional(),
  menHero: z.string().max(800).optional(),
  womenTiles: z.array(tileSchema).optional(),
  menTiles: z.array(tileSchema).optional(),
  megaWomen: z.array(tileSchema).optional(),
  megaMen: z.array(tileSchema).optional(),
  ticker: z.array(z.string().max(200)).optional(),
  promoCodes: z.array(z.string().max(120)).optional(),
  offers: z
    .array(z.object({ kicker: z.string().max(80), code: z.string().max(40), text: z.string().max(180), href: z.string().max(400) }))
    .optional(),
});

export const collectionSchema = z.object({
  name: z.string().min(2).max(180),
  slug: z.string().max(200).optional(),
  season: z.enum(["spring", "summer", "festive", "winter", "all"]).optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED", "DRAFT"]).optional(),
  seoTitle: z.string().max(180).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  productIds: z.array(z.number().int().positive()).optional(),
});

export const lookbookSchema = z.object({
  title: z.string().min(2).max(255),
  slug: z.string().max(200).optional(),
  brandId: z.number().int().positive().nullable().optional(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().max(800).optional().nullable(),
  videoUrl: z.string().max(800).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED", "DRAFT"]).optional(),
  productIds: z.array(z.number().int().positive()).optional(),
});

function uniqueIds(ids?: number[]) {
  return [...new Set(ids ?? [])];
}

async function uniqueTableSlug(
  table: typeof collections | typeof lookbooks,
  base: string,
  excludeId?: number,
) {
  let slug = toSlug(base);
  let i = 0;
  while (true) {
    const [found] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
    if (!found || found.id === excludeId) return slug;
    i += 1;
    slug = `${toSlug(base)}-${i || uniqueSuffix()}`;
  }
}

export async function getEditorial(): Promise<StorefrontEditorial> {
  const cached = cacheGet<StorefrontEditorial>("editorial");
  if (cached) return cached;
  const [row] = await db.select().from(settings).where(eq(settings.key, EDITORIAL_KEY)).limit(1);
  const next = mergeEditorial(row?.value ?? DEFAULT_EDITORIAL);
  cacheSet("editorial", next, 45_000);
  return next;
}

export async function saveEditorial(adminId: number, input: z.infer<typeof editorialSchema>) {
  const next = mergeEditorial({ ...(await getEditorial()), ...input });
  const [row] = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, EDITORIAL_KEY)).limit(1);
  if (row) {
    await db.update(settings).set({ value: next }).where(eq(settings.id, row.id));
  } else {
    await db.insert(settings).values({ key: EDITORIAL_KEY, value: next });
  }
  invalidateStorefrontCache();
  cacheSet("editorial", next, 45_000);
  await audit({ adminUserId: adminId, action: "SETTINGS_UPDATED", resource: "editorial", resourceId: 0 });
  return next;
}

export async function listCollectionsAdmin() {
  try {
    const rows = await db.select().from(collections).orderBy(desc(collections.updatedAt));
    const counts = await db
      .select({ collectionId: collectionProducts.collectionId, total: sql<number>`count(*)` })
      .from(collectionProducts)
      .groupBy(collectionProducts.collectionId);
    const countMap = new Map(counts.map((c) => [c.collectionId, Number(c.total)]));
    return rows.map((r) => ({ ...r, productCount: countMap.get(r.id) ?? 0 }));
  } catch {
    return [];
  }
}

export async function getCollectionAdmin(id: number) {
  const [row] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Collection not found", 404);
  const links = await db
    .select()
    .from(collectionProducts)
    .where(eq(collectionProducts.collectionId, id))
    .orderBy(asc(collectionProducts.sortOrder));
  const ids = links.map((l) => l.productId);
  const productRows = ids.length
    ? await db.select({ id: products.id, name: products.name, slug: products.slug, status: products.status }).from(products).where(inArray(products.id, ids))
    : [];
  const byId = new Map(productRows.map((p) => [p.id, p]));
  return {
    ...row,
    products: ids.map((pid) => byId.get(pid)).filter(Boolean),
    productIds: ids,
  };
}

export async function createCollection(adminId: number, input: z.infer<typeof collectionSchema>) {
  const slug = await uniqueTableSlug(collections, input.slug || input.name);
  const result = await db.insert(collections).values({
    name: input.name,
    slug,
    season: input.season ?? "all",
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    status: input.status ?? "ACTIVE",
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  });
  const id = Number(result[0].insertId);
    if (input.productIds?.length) {
    const ids = uniqueIds(input.productIds);
    await db.insert(collectionProducts).values(ids.map((productId, i) => ({ collectionId: id, productId, sortOrder: i })));
  }
  await audit({ adminUserId: adminId, action: "COLLECTION_CREATED", resource: "collection", resourceId: id });
  invalidateStorefrontCache();
  return getCollectionAdmin(id);
}

export async function updateCollection(adminId: number, id: number, input: z.infer<typeof collectionSchema>) {
  await getCollectionAdmin(id);
  const slug = await uniqueTableSlug(collections, input.slug || input.name, id);
  await db
    .update(collections)
    .set({
      name: input.name,
      slug,
      season: input.season ?? "all",
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      status: input.status ?? "ACTIVE",
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    })
    .where(eq(collections.id, id));
    if (input.productIds) {
    const ids = uniqueIds(input.productIds);
    await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, id));
    if (ids.length) {
      await db.insert(collectionProducts).values(ids.map((productId, i) => ({ collectionId: id, productId, sortOrder: i })));
    }
  }
  await audit({ adminUserId: adminId, action: "COLLECTION_UPDATED", resource: "collection", resourceId: id });
  invalidateStorefrontCache();
  return getCollectionAdmin(id);
}

export async function archiveCollection(adminId: number, id: number) {
  await getCollectionAdmin(id);
  await db.update(collections).set({ status: "ARCHIVED" }).where(eq(collections.id, id));
  await audit({ adminUserId: adminId, action: "COLLECTION_DELETED", resource: "collection", resourceId: id });
  invalidateStorefrontCache();
}

export async function listLookbooksAdmin() {
  const rows = await db.select().from(lookbooks).orderBy(desc(lookbooks.updatedAt));
  const brandRows = await db.select({ id: brands.id, name: brands.name }).from(brands);
  const brandMap = new Map(brandRows.map((b) => [b.id, b.name]));
  const counts = await db
    .select({ lookbookId: lookbookItems.lookbookId, total: sql<number>`count(*)` })
    .from(lookbookItems)
    .groupBy(lookbookItems.lookbookId);
  const countMap = new Map(counts.map((c) => [c.lookbookId, Number(c.total)]));
  return rows.map((r) => ({
    ...r,
    brandName: r.brandId ? brandMap.get(r.brandId) ?? null : null,
    productCount: countMap.get(r.id) ?? 0,
  }));
}

export async function getLookbookAdmin(id: number) {
  const [row] = await db.select().from(lookbooks).where(eq(lookbooks.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Lookbook not found", 404);
  const links = await db.select().from(lookbookItems).where(eq(lookbookItems.lookbookId, id)).orderBy(asc(lookbookItems.sortOrder));
  const ids = links.map((l) => l.productId);
  const productRows = ids.length
    ? await db.select({ id: products.id, name: products.name, slug: products.slug, status: products.status }).from(products).where(inArray(products.id, ids))
    : [];
  const byId = new Map(productRows.map((p) => [p.id, p]));
  return {
    ...row,
    products: ids.map((pid) => byId.get(pid)).filter(Boolean),
    productIds: ids,
  };
}

export async function createLookbook(adminId: number, input: z.infer<typeof lookbookSchema>) {
  const slug = await uniqueTableSlug(lookbooks, input.slug || input.title);
  const result = await db.insert(lookbooks).values({
    title: input.title,
    slug,
    brandId: input.brandId ?? null,
    description: input.description ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
    videoUrl: input.videoUrl ?? null,
    status: input.status ?? "ACTIVE",
  });
  const id = Number(result[0].insertId);
    if (input.productIds?.length) {
    const ids = uniqueIds(input.productIds);
    await db.insert(lookbookItems).values(ids.map((productId, i) => ({ lookbookId: id, productId, sortOrder: i })));
  }
  await audit({ adminUserId: adminId, action: "LOOKBOOK_CREATED", resource: "lookbook", resourceId: id });
  invalidateStorefrontCache();
  return getLookbookAdmin(id);
}

export async function updateLookbook(adminId: number, id: number, input: z.infer<typeof lookbookSchema>) {
  await getLookbookAdmin(id);
  const slug = await uniqueTableSlug(lookbooks, input.slug || input.title, id);
  await db
    .update(lookbooks)
    .set({
      title: input.title,
      slug,
      brandId: input.brandId ?? null,
      description: input.description ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      status: input.status ?? "ACTIVE",
    })
    .where(eq(lookbooks.id, id));
    if (input.productIds) {
    const ids = uniqueIds(input.productIds);
    await db.delete(lookbookItems).where(eq(lookbookItems.lookbookId, id));
    if (ids.length) {
      await db.insert(lookbookItems).values(ids.map((productId, i) => ({ lookbookId: id, productId, sortOrder: i })));
    }
  }
  await audit({ adminUserId: adminId, action: "LOOKBOOK_UPDATED", resource: "lookbook", resourceId: id });
  invalidateStorefrontCache();
  return getLookbookAdmin(id);
}

export async function archiveLookbook(adminId: number, id: number) {
  await getLookbookAdmin(id);
  await db.update(lookbooks).set({ status: "ARCHIVED" }).where(eq(lookbooks.id, id));
  await audit({ adminUserId: adminId, action: "LOOKBOOK_DELETED", resource: "lookbook", resourceId: id });
  invalidateStorefrontCache();
}
