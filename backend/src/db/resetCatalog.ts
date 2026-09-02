import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { CATALOG, CATEGORY_IMAGES, CATEGORY_TREE, CLOTHING_BRANDS, SIZES } from "./catalogData";
import {
  brands,
  categories,
  inventory,
  inventoryTransactions,
  productCategories,
  productImages,
  productVariants,
  products,
} from "./schema";

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function insertId(result: [{ insertId: number }, unknown]) {
  return Number(result[0].insertId);
}

async function claimSlug(slug: string, keepId?: number) {
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
  if (!existing || existing.id === keepId) return slug;
  await db
    .update(products)
    .set({ slug: `${slug}-old-${existing.id}`, status: "ARCHIVED" })
    .where(eq(products.id, existing.id));
  return slug;
}

async function ensureGenderColumn() {
  try {
    await pool.query(
      "ALTER TABLE products ADD COLUMN gender ENUM('MEN','WOMEN','UNISEX') NOT NULL DEFAULT 'UNISEX' AFTER is_new",
    );
    console.log("Added products.gender column");
  } catch (err) {
    const code = (err as { errno?: number }).errno;
    if (code !== 1060) throw err;
  }
}

async function ensureTaxonomy() {
  const keepCatNames = new Set(CATEGORY_TREE.flatMap((c) => [c.name, ...c.children]));
  const keepBrandNames = new Set(CLOTHING_BRANDS);

  const existingCats = await db.select().from(categories);
  for (const cat of existingCats) {
    if (!keepCatNames.has(cat.name)) {
      await db.update(categories).set({ status: "ARCHIVED" }).where(eq(categories.id, cat.id));
    }
  }

  const catByName = new Map((await db.select().from(categories)).map((c) => [c.name, c]));
  let sort = 0;
  for (const parent of CATEGORY_TREE) {
    let row = catByName.get(parent.name);
    if (!row) {
      const id = await insertId(
        await db.insert(categories).values({
          name: parent.name,
          slug: slugify(parent.name),
          description: `${parent.name} for the Nexperts clothing collection.`,
          seoTitle: `${parent.name} | Nexperts`,
          seoDescription: `Shop ${parent.name.toLowerCase()} online at Nexperts.`,
          imageUrl: CATEGORY_IMAGES[parent.name] ?? null,
          sortOrder: sort,
          status: "ACTIVE",
        }),
      );
      row = { id, name: parent.name } as (typeof existingCats)[number];
      catByName.set(parent.name, row);
    } else {
      await db
        .update(categories)
        .set({
          status: "ACTIVE",
          description: `${parent.name} for the Nexperts clothing collection.`,
          imageUrl: CATEGORY_IMAGES[parent.name] ?? row.imageUrl,
          sortOrder: sort,
        })
        .where(eq(categories.id, row.id));
    }
    sort += 1;
    for (const child of parent.children) {
      const existing = catByName.get(child);
      if (!existing) {
        await db.insert(categories).values({
          name: child,
          slug: slugify(child),
          parentId: row.id,
          description: child,
          seoTitle: `${child} | Nexperts`,
          seoDescription: `Shop ${child.toLowerCase()} at Nexperts.`,
          imageUrl: CATEGORY_IMAGES[child] ?? null,
          sortOrder: sort,
          status: "ACTIVE",
        });
      } else {
        await db.update(categories).set({ status: "ACTIVE", parentId: row.id, sortOrder: sort, imageUrl: CATEGORY_IMAGES[child] ?? existing.imageUrl }).where(eq(categories.id, existing.id));
      }
      sort += 1;
    }
  }

  const existingBrands = await db.select().from(brands);
  for (const brand of existingBrands) {
    if (!keepBrandNames.has(brand.name)) {
      await db.update(brands).set({ status: "ARCHIVED" }).where(eq(brands.id, brand.id));
    }
  }
  const brandByName = new Map((await db.select().from(brands)).map((b) => [b.name, b]));
  for (const name of CLOTHING_BRANDS) {
    const found = brandByName.get(name);
    if (!found) {
      await db.insert(brands).values({
        name,
        slug: slugify(name),
        description: `${name} clothing on Nexperts.`,
        logoUrl: `https://picsum.photos/seed/brand-${slugify(name)}/200/200`,
        seoTitle: name,
        seoDescription: `Shop ${name} clothing.`,
        status: "ACTIVE",
      });
    } else {
      await db.update(brands).set({ status: "ACTIVE", description: `${name} clothing on Nexperts.` }).where(eq(brands.id, found.id));
    }
  }
}

async function syncSizes(productId: number, item: (typeof CATALOG)[number]) {
  const existing = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  const bySku = new Map(existing.map((v) => [v.sku, v]));
  for (const [index, size] of SIZES.entries()) {
    const sku = `${item.sku}-${size}`;
    const found = bySku.get(sku);
    if (found) {
      await db
        .update(productVariants)
        .set({
          sku,
          name: size,
          attributes: { size, gender: item.gender },
          price: String(item.price),
          mrp: String(item.mrp),
          isDefault: index === 0,
          status: "ACTIVE",
        })
        .where(eq(productVariants.id, found.id));
    } else {
      const vid = await insertId(
        await db.insert(productVariants).values({
          productId,
          sku,
          name: size,
          attributes: { size, gender: item.gender },
          price: String(item.price),
          mrp: String(item.mrp),
          isDefault: index === 0,
        }),
      );
      await db.insert(inventory).values({ variantId: vid, stock: 12 + index * 4, reservedStock: 0, reorderLevel: 4 });
      await db.insert(inventoryTransactions).values({
        variantId: vid,
        previousStock: 0,
        newStock: 12 + index * 4,
        difference: 12 + index * 4,
        reason: "PURCHASE",
        notes: "Catalog reset",
      });
    }
  }
  const keepSkus = SIZES.map((size) => `${item.sku}-${size}`);
  for (const variant of existing) {
    if (!keepSkus.includes(variant.sku)) {
      await db.update(productVariants).set({ status: "ARCHIVED", isDefault: false }).where(eq(productVariants.id, variant.id));
    }
  }
}

async function main() {
  await ensureGenderColumn();
  await ensureTaxonomy();
  await pool.query("UPDATE products SET status = 'ARCHIVED'");

  const allCats = await db.select().from(categories);
  const catByName = new Map(allCats.filter((c) => c.status === "ACTIVE").map((c) => [c.name, c.id]));
  const allBrands = await db.select().from(brands);
  const brandByName = new Map(allBrands.filter((b) => b.status === "ACTIVE").map((b) => [b.name, b.id]));
  const keepIds: number[] = [];

  for (const item of CATALOG) {
    const desiredSlug = slugify(item.name);
    const [bySku] = await db
      .select({ id: products.id })
      .from(products)
      .innerJoin(productVariants, eq(productVariants.productId, products.id))
      .where(eq(productVariants.sku, `${item.sku}-S`))
      .limit(1);
    const [bySlug] = bySku
      ? []
      : await db.select({ id: products.id }).from(products).where(eq(products.slug, desiredSlug)).limit(1);
    const found = bySku ?? bySlug;
    const slug = await claimSlug(desiredSlug, found?.id);
    const catIds = [catByName.get(item.category), item.extraCategory ? catByName.get(item.extraCategory) : undefined].filter(
      (id): id is number => Boolean(id),
    );
    const productFields = {
      name: item.name,
      slug,
      description: item.description,
      brandId: brandByName.get(item.brand) ?? null,
      status: "PUBLISHED" as const,
      gender: item.gender,
      seoTitle: `${item.name} | ${item.brand} | Nexperts`,
      seoDescription: `${item.description.slice(0, 140)}…`,
      specifications: {
        Brand: item.brand,
        Gender: item.gender,
        Category: item.category,
        Fabric: item.fabric,
        Fit: item.fit,
        Care: "Gentle wash · Dry clean recommended for evening wear",
      },
      shippingInfo: "Ships within 24–48 hours. Free shipping on orders above RM 999. Premium packaging on every order.",
      returnInfo: "7-day easy returns on unused items with tags attached.",
      isFeatured: true,
      isNew: true,
    };

    let pid: number;
    if (found) {
      pid = found.id;
      await db.update(products).set(productFields).where(eq(products.id, pid));
      await db.delete(productCategories).where(eq(productCategories.productId, pid));
      await db.delete(productImages).where(eq(productImages.productId, pid));
    } else {
      pid = await insertId(await db.insert(products).values(productFields));
    }

    await syncSizes(pid, item);

    if (catIds.length) {
      await db.insert(productCategories).values(catIds.map((categoryId) => ({ productId: pid, categoryId })));
    }
    await db.insert(productImages).values([
      { productId: pid, url: item.image, storageKey: `catalog/${item.sku}-1.jpg`, alt: item.name, sortOrder: 0, isPrimary: true },
      { productId: pid, url: item.image2, storageKey: `catalog/${item.sku}-2.jpg`, alt: `${item.name} alternate`, sortOrder: 1, isPrimary: false },
    ]);
    keepIds.push(pid);
  }

  if (keepIds.length) {
    const placeholders = keepIds.map(() => "?").join(",");
    await pool.query(
      `DELETE FROM product_images WHERE product_id NOT IN (${placeholders})
       AND product_id NOT IN (SELECT product_id FROM order_items)`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM product_categories WHERE product_id NOT IN (${placeholders})
       AND product_id NOT IN (SELECT product_id FROM order_items)`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM wishlist_items WHERE product_id NOT IN (${placeholders})
       AND product_id NOT IN (SELECT product_id FROM order_items)`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM cart_items WHERE variant_id IN (
         SELECT id FROM product_variants WHERE product_id NOT IN (${placeholders})
         AND product_id NOT IN (SELECT product_id FROM order_items)
       )`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM inventory_transactions WHERE variant_id IN (
         SELECT id FROM product_variants WHERE product_id NOT IN (${placeholders})
         AND product_id NOT IN (SELECT product_id FROM order_items)
       )`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM inventory WHERE variant_id IN (
         SELECT id FROM product_variants WHERE product_id NOT IN (${placeholders})
         AND product_id NOT IN (SELECT product_id FROM order_items)
       )`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM product_variants WHERE product_id NOT IN (${placeholders})
       AND product_id NOT IN (SELECT product_id FROM order_items)`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM reviews WHERE product_id NOT IN (${placeholders})
       AND product_id NOT IN (SELECT product_id FROM order_items)`,
      keepIds,
    );
    await pool.query(
      `DELETE FROM products WHERE id NOT IN (${placeholders})
       AND id NOT IN (SELECT product_id FROM order_items)`,
      keepIds,
    );
    // Leftover order-linked products stay archived; hide their SKUs from live inventory
    await pool.query(
      `UPDATE product_variants v
       INNER JOIN products p ON p.id = v.product_id
       SET v.status = 'ARCHIVED', v.is_default = 0
       WHERE p.status = 'ARCHIVED' AND v.status = 'ACTIVE'`,
    );
  } else {
    await pool.query(
      `UPDATE product_variants v
       INNER JOIN products p ON p.id = v.product_id
       SET v.status = 'ARCHIVED', v.is_default = 0
       WHERE p.status = 'ARCHIVED' AND v.status = 'ACTIVE'`,
    );
  }

  await pool.query(`
    DELETE pc FROM product_categories pc
    INNER JOIN categories c ON c.id = pc.category_id
    WHERE c.status = 'ARCHIVED'
  `);
  await pool.query("DELETE FROM categories WHERE status = 'ARCHIVED' AND parent_id IS NOT NULL");
  await pool.query("DELETE FROM categories WHERE status = 'ARCHIVED'");
  await pool.query(`
    UPDATE products p
    INNER JOIN brands b ON b.id = p.brand_id
    LEFT JOIN order_items oi ON oi.product_id = p.id
    SET p.brand_id = NULL
    WHERE b.status = 'ARCHIVED' AND oi.id IS NULL
  `);
  await pool.query(`
    DELETE b FROM brands b
    LEFT JOIN products p ON p.brand_id = b.id
    WHERE b.status = 'ARCHIVED' AND p.id IS NULL
  `);

  const [[{ published }]] = (await pool.query(
    "SELECT COUNT(*) AS published FROM products WHERE status = 'PUBLISHED'",
  )) as unknown as [[{ published: number }]];
  console.log(`Catalog reset complete. Published products: ${published}`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
