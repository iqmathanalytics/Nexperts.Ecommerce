/**
 * Upsert the UrbanThread Balloon Sleeve Sale Set (women, on sale) into the live DB.
 * Usage: npx tsx src/db/addBalloonSaleProduct.ts
 */
import { and, eq } from "drizzle-orm";
import { db, pool } from "./index";
import { SIZES } from "./catalogData";
import {
  brands,
  categories,
  inventory,
  inventoryTransactions,
  productCategories,
  productImages,
  productVariants,
  products,
  users,
} from "./schema";
import { toSlug } from "../utils/slug";

const NAME = "UrbanThread Balloon Sleeve Sale Set";
const SKU = "NX-WS-025";
const PRICE = 1299;
const MRP = 2499;
const IMAGE = "/products/urbanthread-balloon-sleeve-set.jpg";
const IMAGE2 = "https://images.pexels.com/photos/13076542/pexels-photo-13076542.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=1600";

async function insertId(result: [{ insertId: number }, unknown]) {
  return Number(result[0].insertId);
}

async function main() {
  const [brand] = await db.select().from(brands).where(eq(brands.name, "UrbanThread")).limit(1);
  if (!brand) throw new Error("UrbanThread brand missing — run seed first");

  const [tops] = await db.select().from(categories).where(eq(categories.slug, "tops")).limit(1);
  const [bottoms] = await db.select().from(categories).where(eq(categories.slug, "bottoms")).limit(1);
  if (!tops) throw new Error("Tops category missing");

  const [admin] = await db.select().from(users).where(eq(users.email, "admin@nexpertsacademy.com")).limit(1);
  const adminId = admin?.id ?? null;

  const slug = toSlug(NAME);
  const [existing] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

  let productId = existing?.id;
  if (existing) {
    await db
      .update(products)
      .set({
        name: NAME,
        description:
          "A monochrome off-shoulder balloon-sleeve blouse with a flared peplum and matching black mini skirt, finished with a slim belt and gold buckle. A high-contrast sale look for warm days and city evenings.",
        brandId: brand.id,
        status: "PUBLISHED",
        gender: "WOMEN",
        isFeatured: true,
        isNew: true,
        seoTitle: `${NAME} | Sale | Nexperts`,
        seoDescription: "Women's sale set — balloon sleeve blouse and black mini skirt.",
        specifications: {
          Brand: "UrbanThread",
          Gender: "WOMEN",
          Category: "Tops",
          Fabric: "Cotton-blend poplin",
          Fit: "Oversized top · A-line mini",
          Care: "Cold gentle wash. Hang dry.",
          Sale: "Limited markdown",
        },
        shippingInfo: "Ships within 24–48 hours. Free shipping on orders above RM 999.",
        returnInfo: "7-day easy returns on unused items with tags attached.",
      })
      .where(eq(products.id, existing.id));
    console.log(`Updated product id=${productId}`);
  } else {
    productId = await insertId(
      await db.insert(products).values({
        name: NAME,
        slug,
        description:
          "A monochrome off-shoulder balloon-sleeve blouse with a flared peplum and matching black mini skirt, finished with a slim belt and gold buckle. A high-contrast sale look for warm days and city evenings.",
        brandId: brand.id,
        status: "PUBLISHED",
        gender: "WOMEN",
        isFeatured: true,
        isNew: true,
        seoTitle: `${NAME} | Sale | Nexperts`,
        seoDescription: "Women's sale set — balloon sleeve blouse and black mini skirt.",
        specifications: {
          Brand: "UrbanThread",
          Gender: "WOMEN",
          Category: "Tops",
          Fabric: "Cotton-blend poplin",
          Fit: "Oversized top · A-line mini",
          Care: "Cold gentle wash. Hang dry.",
          Sale: "Limited markdown",
        },
        shippingInfo: "Ships within 24–48 hours. Free shipping on orders above RM 999.",
        returnInfo: "7-day easy returns on unused items with tags attached.",
      }),
    );
    console.log(`Created product id=${productId}`);
  }

  await db.delete(productCategories).where(eq(productCategories.productId, productId!));
  const catRows = [{ productId: productId!, categoryId: tops.id }];
  if (bottoms) catRows.push({ productId: productId!, categoryId: bottoms.id });
  await db.insert(productCategories).values(catRows);

  await db.delete(productImages).where(eq(productImages.productId, productId!));
  await db.insert(productImages).values([
    {
      productId: productId!,
      url: IMAGE,
      storageKey: `catalog/${SKU}-1.jpg`,
      alt: NAME,
      sortOrder: 0,
      isPrimary: true,
    },
    {
      productId: productId!,
      url: IMAGE2,
      storageKey: `catalog/${SKU}-2.jpg`,
      alt: `${NAME} alternate`,
      sortOrder: 1,
      isPrimary: false,
    },
  ]);

  const existingVariants = await db.select().from(productVariants).where(eq(productVariants.productId, productId!));
  let defaultVariantId = 0;
  for (const [index, size] of SIZES.entries()) {
    const sku = `${SKU}-${size}`;
    const found = existingVariants.find((v) => v.sku === sku);
    let variantId = found?.id;
    if (found) {
      await db
        .update(productVariants)
        .set({
          name: size,
          attributes: { size, gender: "WOMEN" },
          price: String(PRICE),
          mrp: String(MRP),
          isDefault: index === 0,
          status: "ACTIVE",
        })
        .where(eq(productVariants.id, found.id));
    } else {
      variantId = await insertId(
        await db.insert(productVariants).values({
          productId: productId!,
          sku,
          name: size,
          attributes: { size, gender: "WOMEN" },
          price: String(PRICE),
          mrp: String(MRP),
          isDefault: index === 0,
        }),
      );
      await db.insert(inventory).values({ variantId: variantId!, stock: 20, reservedStock: 0, reorderLevel: 4 });
      if (adminId) {
        await db.insert(inventoryTransactions).values({
          variantId: variantId!,
          previousStock: 0,
          newStock: 20,
          difference: 20,
          reason: "PURCHASE",
          adminUserId: adminId,
          notes: "Sale set initial stock",
        });
      }
    }
    const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, variantId!)).limit(1);
    if (inv && inv.stock < 8) {
      await db.update(inventory).set({ stock: 20 }).where(eq(inventory.variantId, variantId!));
    }
    if (index === 0) defaultVariantId = variantId!;
  }

  console.log(
    JSON.stringify(
      {
        productId,
        slug,
        defaultVariantId,
        price: PRICE,
        mrp: MRP,
        discountPercent: Math.round(((MRP - PRICE) / MRP) * 100),
        pdp: `http://localhost:3000/products/${slug}`,
        sale: "http://localhost:3000/sale",
        women: "http://localhost:3000/women",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
