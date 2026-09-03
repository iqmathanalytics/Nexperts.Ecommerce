import { z } from "zod";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  brands,
  categories,
  inventory,
  productCategories,
  productImages,
  productVariants,
  products,
} from "../../db/schema";
import { AppError } from "../../utils/http";
import { toSlug, uniqueSuffix } from "../../utils/slug";
import { audit } from "../../utils/audit";
import { deleteImage, uploadImage } from "../../utils/storage";
import { setStockWithAudit } from "../inventory/inventory.service";
import { invalidateStorefrontCache } from "../../utils/ttlCache";

export const upsertProductSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().max(280).optional(),
  description: z.string().optional(),
  brandId: z.number().int().positive().nullable().optional(),
  categoryIds: z.array(z.number().int().positive()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  seoTitle: z.string().max(180).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  specifications: z.record(z.string()).optional().nullable(),
  shippingInfo: z.string().optional().nullable(),
  returnInfo: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional().default("UNISEX"),
  variants: z
    .array(
      z.object({
        id: z.number().optional(),
        sku: z.string().min(2).max(80),
        name: z.string().min(1).max(150),
        attributes: z.record(z.string()).optional().nullable(),
        price: z.coerce.number().positive(),
        mrp: z.coerce.number().positive(),
        isDefault: z.boolean().optional(),
        stock: z.coerce.number().int().min(0).optional(),
        reorderLevel: z.coerce.number().int().min(0).optional(),
      }),
    )
    .min(1),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().max(180).optional(),
  parentId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.number().int().positive().nullable().optional()),
  description: z.string().optional().nullable(),
  imageUrl: z.preprocess((v) => (v === "" ? null : v), z.string().max(800).optional().nullable()),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  seoTitle: z.preprocess((v) => (v === "" ? null : v), z.string().max(180).optional().nullable()),
  seoDescription: z.preprocess((v) => (v === "" ? null : v), z.string().max(320).optional().nullable()),
  sortOrder: z.coerce.number().int().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().max(180).optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.preprocess((v) => (v === "" ? null : v), z.string().max(800).optional().nullable()),
  lookbookBio: z.string().optional().nullable(),
  heroImageUrl: z.preprocess((v) => (v === "" ? null : v), z.string().max(800).optional().nullable()),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  seoTitle: z.preprocess((v) => (v === "" ? null : v), z.string().max(180).optional().nullable()),
  seoDescription: z.preprocess((v) => (v === "" ? null : v), z.string().max(320).optional().nullable()),
});

export const imageMetaSchema = z.object({
  alt: z.string().max(255).optional().nullable(),
});

async function uniqueProductSlug(base: string, excludeId?: number) {
  let slug = toSlug(base);
  let i = 0;
  while (true) {
    const [found] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (!found || found.id === excludeId) return slug;
    i += 1;
    slug = `${toSlug(base)}-${i}`;
  }
}

async function uniqueSku(base: string, excludeId?: number) {
  const seed = (base || `sku-${uniqueSuffix()}`).slice(0, 70);
  let sku = seed;
  let i = 0;
  while (true) {
    const [found] = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.sku, sku)).limit(1);
    if (!found || found.id === excludeId) return sku;
    i += 1;
    sku = `${seed}-${i}`;
  }
}

export async function adminListProducts(q?: string, status?: string, page = 1, limit = 20) {
  const filters = [];
  if (q) filters.push(or(like(products.name, `%${q}%`), like(products.slug, `%${q}%`)));
  if (status) filters.push(eq(products.status, status as "DRAFT" | "PUBLISHED" | "ARCHIVED"));
  const where = filters.length ? and(...filters) : undefined;
  const offset = (page - 1) * limit;
  const items = await db.select().from(products).where(where).orderBy(desc(products.updatedAt)).limit(limit).offset(offset);
  const countRows = await db.select({ total: sql<number>`count(*)` }).from(products).where(where);
  const ids = items.map((p) => p.id);
  const images = ids.length ? await db.select().from(productImages).where(inArray(productImages.productId, ids)) : [];
  const variants = ids.length
    ? await db.select().from(productVariants).where(and(inArray(productVariants.productId, ids), eq(productVariants.status, "ACTIVE")))
    : [];
  return {
    items: items.map((p) => {
      const imgs = images.filter((i) => i.productId === p.id).sort((a, b) => a.sortOrder - b.sortOrder);
      const vs = variants.filter((v) => v.productId === p.id);
      const def = vs.find((v) => v.isDefault) ?? vs[0];
      return {
        ...p,
        imageUrl: imgs.find((i) => i.isPrimary)?.url ?? imgs[0]?.url ?? null,
        price: def ? Number(def.price) : null,
        mrp: def ? Number(def.mrp) : null,
      };
    }),
    total: Number(countRows[0]?.total ?? 0),
    page,
    limit,
  };
}

async function loadProduct(id: number, includeArchivedVariants = false) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
  const visible = includeArchivedVariants ? variants : variants.filter((v) => v.status !== "ARCHIVED");
  const inv = visible.length
    ? await db.select().from(inventory).where(inArray(inventory.variantId, visible.map((v) => v.id)))
    : [];
  const images = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder));
  const cats = await db.select().from(productCategories).where(eq(productCategories.productId, id));
  return {
    ...product,
    categoryIds: cats.map((c) => c.categoryId),
    variants: visible.map((v) => ({
      ...v,
      inventory: inv.find((i) => i.variantId === v.id) ?? null,
    })),
    allVariants: variants,
    images,
  };
}

export async function adminGetProduct(id: number) {
  const { allVariants: _all, ...product } = await loadProduct(id, false);
  return product;
}

export async function createProduct(adminId: number, input: z.infer<typeof upsertProductSchema>, ip?: string) {
  const slug = await uniqueProductSlug(input.slug || input.name);
  const result = await db.insert(products).values({
    name: input.name,
    slug,
    description: input.description ?? null,
    brandId: input.brandId ?? null,
    status: input.status ?? "DRAFT",
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    specifications: input.specifications ?? null,
    shippingInfo: input.shippingInfo ?? null,
    returnInfo: input.returnInfo ?? null,
    isFeatured: input.isFeatured ?? false,
    isNew: input.isNew ?? true,
    gender: input.gender ?? "UNISEX",
  });
  const productId = Number(result[0].insertId);
  if (input.categoryIds.length) {
    await db.insert(productCategories).values(input.categoryIds.map((categoryId) => ({ productId, categoryId })));
  }
  let defaultSet = false;
  for (const [idx, v] of input.variants.entries()) {
    const isDefault = v.isDefault || (!defaultSet && idx === 0);
    if (isDefault) defaultSet = true;
    const vr = await db.insert(productVariants).values({
      productId,
      sku: await uniqueSku(v.sku),
      name: v.name,
      attributes: v.attributes ?? null,
      price: String(v.price),
      mrp: String(v.mrp),
      isDefault,
    });
    const variantId = Number(vr[0].insertId);
    await db.insert(inventory).values({
      variantId,
      stock: 0,
      reservedStock: 0,
      reorderLevel: v.reorderLevel ?? 5,
    });
    if ((v.stock ?? 0) > 0) {
      await setStockWithAudit(adminId, variantId, v.stock ?? 0, "Initial stock from product create", ip, v.reorderLevel ?? 5);
    }
  }
  await audit({ adminUserId: adminId, action: "PRODUCT_CREATED", resource: "product", resourceId: productId, ip });
  invalidateStorefrontCache();
  return adminGetProduct(productId);
}

export async function updateProduct(adminId: number, id: number, input: z.infer<typeof upsertProductSchema>, ip?: string) {
  const existing = await loadProduct(id, true);
  const slug = await uniqueProductSlug(input.slug || input.name, id);
  const oldPrices = existing.variants.map((v) => ({ sku: v.sku, price: v.price }));
  await db
    .update(products)
    .set({
      name: input.name,
      slug,
      description: input.description ?? null,
      brandId: input.brandId ?? null,
      status: input.status ?? existing.status,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      specifications: input.specifications ?? null,
      shippingInfo: input.shippingInfo ?? null,
      returnInfo: input.returnInfo ?? null,
      isFeatured: input.isFeatured ?? existing.isFeatured,
      isNew: input.isNew ?? existing.isNew,
      gender: input.gender ?? existing.gender ?? "UNISEX",
    })
    .where(eq(products.id, id));
  await db.delete(productCategories).where(eq(productCategories.productId, id));
  if (input.categoryIds.length) {
    await db.insert(productCategories).values(input.categoryIds.map((categoryId) => ({ productId: id, categoryId })));
  }
  const keepIds: number[] = [];
  for (const [idx, v] of input.variants.entries()) {
    const archivedMatch = !v.id ? existing.allVariants.find((x) => x.sku === v.sku) : undefined;
    const variantId = v.id ?? archivedMatch?.id;
    if (variantId) {
      keepIds.push(variantId);
      await db
        .update(productVariants)
        .set({
          sku: await uniqueSku(v.sku, variantId),
          name: v.name,
          attributes: v.attributes ?? null,
          price: String(v.price),
          mrp: String(v.mrp),
          isDefault: v.isDefault || idx === 0,
          status: "ACTIVE",
        })
        .where(eq(productVariants.id, variantId));
      if (v.stock != null) {
        try {
          await setStockWithAudit(adminId, variantId, v.stock, "Stock updated via product editor", ip, v.reorderLevel ?? undefined);
        } catch (err) {
          // Don't block product metadata saves when stock can't drop below reserved units.
          if (!(err instanceof AppError) || err.code !== "NEGATIVE_STOCK") throw err;
          if (v.reorderLevel != null) {
            await db.update(inventory).set({ reorderLevel: v.reorderLevel }).where(eq(inventory.variantId, variantId));
          }
        }
      } else if (v.reorderLevel != null) {
        await db.update(inventory).set({ reorderLevel: v.reorderLevel }).where(eq(inventory.variantId, variantId));
      }
    } else {
      const vr = await db.insert(productVariants).values({
        productId: id,
        sku: await uniqueSku(v.sku),
        name: v.name,
        attributes: v.attributes ?? null,
        price: String(v.price),
        mrp: String(v.mrp),
        isDefault: v.isDefault || false,
        status: "ACTIVE",
      });
      const newId = Number(vr[0].insertId);
      keepIds.push(newId);
      await db.insert(inventory).values({ variantId: newId, stock: 0, reservedStock: 0, reorderLevel: v.reorderLevel ?? 5 });
      if ((v.stock ?? 0) > 0) {
        await setStockWithAudit(adminId, newId, v.stock ?? 0, "Initial stock for new variant", ip, v.reorderLevel ?? 5);
      }
    }
  }
  const toRemove = existing.allVariants.filter((v) => !keepIds.includes(v.id) && v.status !== "ARCHIVED");
  for (const v of toRemove) {
    await db.update(productVariants).set({ status: "ARCHIVED" }).where(eq(productVariants.id, v.id));
  }
  const priceChanged = oldPrices.some((op) => {
    const nv = input.variants.find((x) => x.sku === op.sku);
    return nv && String(nv.price) !== String(op.price);
  });
  await audit({
    adminUserId: adminId,
    action: priceChanged ? "PRICE_CHANGED" : "PRODUCT_UPDATED",
    resource: "product",
    resourceId: id,
    ip,
  });
  invalidateStorefrontCache();
  return adminGetProduct(id);
}

export async function archiveProduct(adminId: number, id: number, ip?: string) {
  await adminGetProduct(id);
  await db.update(products).set({ status: "ARCHIVED" }).where(eq(products.id, id));
  await audit({ adminUserId: adminId, action: "PRODUCT_DELETED", resource: "product", resourceId: id, ip });
  invalidateStorefrontCache();
}

export async function duplicateProduct(adminId: number, id: number, ip?: string) {
  const source = await loadProduct(id, false);
  const copyName = source.name.endsWith("(copy)") ? source.name : `${source.name} (copy)`;
  const created = await createProduct(
    adminId,
    {
      name: copyName,
      description: source.description ?? undefined,
      brandId: source.brandId,
      categoryIds: source.categoryIds,
      status: "DRAFT",
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      specifications: source.specifications ?? undefined,
      shippingInfo: source.shippingInfo,
      returnInfo: source.returnInfo,
      isFeatured: false,
      isNew: true,
      gender: source.gender ?? "UNISEX",
      variants: source.variants.map((v, i) => ({
        sku: `${String(v.sku).slice(0, 60)}-c${uniqueSuffix()}`.slice(0, 80),
        name: v.name,
        attributes: v.attributes ?? undefined,
        price: Number(v.price),
        mrp: Number(v.mrp),
        isDefault: v.isDefault || i === 0,
        stock: v.inventory?.stock ?? 0,
        reorderLevel: v.inventory?.reorderLevel ?? 5,
      })),
    },
    ip,
  );
  for (const img of source.images) {
    await db.insert(productImages).values({
      productId: created.id,
      url: img.url,
      storageKey: img.storageKey,
      alt: img.alt ?? "",
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    });
  }
  await audit({ adminUserId: adminId, action: "PRODUCT_CREATED", resource: "product", resourceId: created.id, metadata: { duplicatedFrom: id }, ip });
  return adminGetProduct(created.id);
}

export async function setProductStatus(adminId: number, id: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  await db.update(products).set({ status }).where(eq(products.id, id));
  await audit({ adminUserId: adminId, action: "PRODUCT_UPDATED", resource: "product", resourceId: id, metadata: { status } });
}

export async function addProductImages(adminId: number, productId: number, files: Express.Multer.File[]) {
  await adminGetProduct(productId);
  const existing = await db.select().from(productImages).where(eq(productImages.productId, productId));
  const created = [];
  for (const [i, file] of files.entries()) {
    const stored = await uploadImage(file, "products");
    const result = await db.insert(productImages).values({
      productId,
      url: stored.url,
      storageKey: stored.key,
      alt: "",
      sortOrder: existing.length + i,
      isPrimary: existing.length === 0 && i === 0,
    });
    created.push({ id: Number(result[0].insertId), ...stored });
  }
  await audit({ adminUserId: adminId, action: "PRODUCT_UPDATED", resource: "product", resourceId: productId, metadata: { images: created.length } });
  invalidateStorefrontCache();
  return created;
}

export async function deleteProductImage(adminId: number, imageId: number) {
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) throw new AppError("NOT_FOUND", "Image not found", 404);
  await deleteImage(img.storageKey);
  await db.delete(productImages).where(eq(productImages.id, imageId));
  if (img.isPrimary) {
    const [next] = await db.select().from(productImages).where(eq(productImages.productId, img.productId)).orderBy(asc(productImages.sortOrder)).limit(1);
    if (next) await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
  }
  await audit({ adminUserId: adminId, action: "PRODUCT_UPDATED", resource: "product", resourceId: img.productId, metadata: { deletedImage: imageId } });
  invalidateStorefrontCache();
}

export async function setPrimaryImage(adminId: number, imageId: number) {
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) throw new AppError("NOT_FOUND", "Image not found", 404);
  await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, img.productId));
  await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, imageId));
  await audit({ adminUserId: adminId, action: "PRODUCT_UPDATED", resource: "product", resourceId: img.productId });
  invalidateStorefrontCache();
}

export async function reorderImages(adminId: number, productId: number, orderedIds: number[]) {
  for (const [i, id] of orderedIds.entries()) {
    await db.update(productImages).set({ sortOrder: i }).where(eq(productImages.id, id));
  }
  await audit({ adminUserId: adminId, action: "PRODUCT_UPDATED", resource: "product", resourceId: productId });
  invalidateStorefrontCache();
}

export async function updateImageMeta(adminId: number, imageId: number, input: z.infer<typeof imageMetaSchema>) {
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) throw new AppError("NOT_FOUND", "Image not found", 404);
  await db.update(productImages).set({ alt: input.alt ?? "" }).where(eq(productImages.id, imageId));
  await audit({ adminUserId: adminId, action: "PRODUCT_UPDATED", resource: "product", resourceId: img.productId, metadata: { imageAlt: imageId } });
  return { ...img, alt: input.alt ?? "" };
}

export async function listCategoriesAdmin() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function createCategory(adminId: number, input: z.infer<typeof categorySchema>) {
  const slug = toSlug(input.slug || input.name) + (await slugExists(input.slug || input.name) ? `-${uniqueSuffix()}` : "");
  const result = await db.insert(categories).values({
    name: input.name,
    slug,
    parentId: input.parentId ?? null,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    status: input.status ?? "ACTIVE",
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    sortOrder: input.sortOrder ?? 0,
  });
  const id = Number(result[0].insertId);
  await audit({ adminUserId: adminId, action: "CATEGORY_CREATED", resource: "category", resourceId: id });
  invalidateStorefrontCache();
  return { id, ...input, slug };
}

async function slugExists(name: string) {
  const slug = toSlug(name);
  const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  return Boolean(row);
}

export async function updateCategory(adminId: number, id: number, input: z.infer<typeof categorySchema>) {
  await db
    .update(categories)
    .set({
      name: input.name,
      slug: toSlug(input.slug || input.name),
      parentId: input.parentId ?? null,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      status: input.status ?? "ACTIVE",
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .where(eq(categories.id, id));
  await audit({ adminUserId: adminId, action: "CATEGORY_UPDATED", resource: "category", resourceId: id });
  invalidateStorefrontCache();
}

export async function archiveCategory(adminId: number, id: number) {
  await db.update(categories).set({ status: "ARCHIVED" }).where(eq(categories.id, id));
  await audit({ adminUserId: adminId, action: "CATEGORY_DELETED", resource: "category", resourceId: id });
  invalidateStorefrontCache();
}

export async function restoreCategory(adminId: number, id: number) {
  await db.update(categories).set({ status: "ACTIVE" }).where(eq(categories.id, id));
  await audit({ adminUserId: adminId, action: "CATEGORY_UPDATED", resource: "category", resourceId: id, metadata: { status: "ACTIVE" } });
  invalidateStorefrontCache();
}

export async function listBrandsAdmin() {
  return db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logoUrl: brands.logoUrl,
      lookbookBio: brands.lookbookBio,
      heroImageUrl: brands.heroImageUrl,
      status: brands.status,
      seoTitle: brands.seoTitle,
      seoDescription: brands.seoDescription,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
    })
    .from(brands)
    .orderBy(asc(brands.name));
}

export async function createBrand(adminId: number, input: z.infer<typeof brandSchema>) {
  const slug = toSlug(input.slug || input.name);
  const result = await db.insert(brands).values({
    name: input.name,
    slug,
    description: input.description ?? null,
    logoUrl: input.logoUrl ?? null,
    lookbookBio: input.lookbookBio ?? null,
    heroImageUrl: input.heroImageUrl ?? null,
    status: input.status ?? "ACTIVE",
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  });
  const id = Number(result[0].insertId);
  await audit({ adminUserId: adminId, action: "BRAND_CREATED", resource: "brand", resourceId: id });
  invalidateStorefrontCache();
  return { id, slug, ...input };
}

export async function updateBrand(adminId: number, id: number, input: z.infer<typeof brandSchema>) {
  await db
    .update(brands)
    .set({
      name: input.name,
      slug: toSlug(input.slug || input.name),
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      lookbookBio: input.lookbookBio ?? null,
      heroImageUrl: input.heroImageUrl ?? null,
      status: input.status ?? "ACTIVE",
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    })
    .where(eq(brands.id, id));
  await audit({ adminUserId: adminId, action: "BRAND_UPDATED", resource: "brand", resourceId: id });
  invalidateStorefrontCache();
}

export async function archiveBrand(adminId: number, id: number) {
  await db.update(brands).set({ status: "ARCHIVED" }).where(eq(brands.id, id));
  await audit({ adminUserId: adminId, action: "BRAND_DELETED", resource: "brand", resourceId: id });
  invalidateStorefrontCache();
}

export async function restoreBrand(adminId: number, id: number) {
  await db.update(brands).set({ status: "ACTIVE" }).where(eq(brands.id, id));
  await audit({ adminUserId: adminId, action: "BRAND_UPDATED", resource: "brand", resourceId: id, metadata: { status: "ACTIVE" } });
  invalidateStorefrontCache();
}

export async function updateBrandLogo(adminId: number, id: number, logoUrl: string) {
  await db.update(brands).set({ logoUrl }).where(eq(brands.id, id));
  await audit({ adminUserId: adminId, action: "BRAND_UPDATED", resource: "brand", resourceId: id, metadata: { logo: true } });
  invalidateStorefrontCache();
}

export async function updateBrandHero(adminId: number, id: number, heroImageUrl: string) {
  await db.update(brands).set({ heroImageUrl }).where(eq(brands.id, id));
  await audit({ adminUserId: adminId, action: "BRAND_UPDATED", resource: "brand", resourceId: id, metadata: { hero: true } });
  invalidateStorefrontCache();
}

export async function updateCategoryImage(adminId: number, id: number, imageUrl: string) {
  await db.update(categories).set({ imageUrl }).where(eq(categories.id, id));
  await audit({ adminUserId: adminId, action: "CATEGORY_UPDATED", resource: "category", resourceId: id, metadata: { image: true } });
  invalidateStorefrontCache();
}
