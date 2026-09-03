/**
 * Upsert featured Women floral dress + Men sky-blue shirt with local gallery images.
 * Usage: npx tsx src/db/addFeaturedLookProducts.ts
 */
import { eq } from "drizzle-orm";
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

type Spec = {
  name: string;
  sku: string;
  brand: string;
  gender: "WOMEN" | "MEN";
  categorySlug: string;
  extraCategorySlug?: string;
  price: number;
  mrp: number;
  description: string;
  fabric: string;
  fit: string;
  care: string;
  styling: string;
  images: Array<{ url: string; alt: string }>;
};

const LOOKS: Spec[] = [
  {
    name: "Petal Rose Smocked Sundress",
    sku: "NX-WD-040",
    brand: "Petal",
    gender: "WOMEN",
    categorySlug: "dresses",
    extraCategorySlug: "casual-dresses",
    price: 1899,
    mrp: 2799,
    fabric: "Lightweight cotton blend",
    fit: "Smocked bodice · Flowy skirt",
    care: "Cold gentle wash. Line dry. Cool iron if needed.",
    styling: "Pair with silver hoops and sandals for day; add a light cardigan for evening.",
    description:
      "A white spaghetti-strap sundress with a rose floral print and smocked bodice. Soft, breathable fabric with a fluid skirt — made for warm days, hill views, and easy summer evenings.",
    images: [
      { url: "/products/petal-rose-smocked-dress-1.jpg", alt: "Petal Rose Smocked Sundress — front" },
      { url: "/products/petal-rose-smocked-dress-2.jpg", alt: "Petal Rose Smocked Sundress — side" },
      { url: "/products/petal-rose-smocked-dress-3.jpg", alt: "Petal Rose Smocked Sundress — back" },
    ],
  },
  {
    name: "UrbanThread Sky Blue Dress Shirt",
    sku: "NX-MS-028",
    brand: "UrbanThread",
    gender: "MEN",
    categorySlug: "tops",
    extraCategorySlug: "shirts",
    price: 1599,
    mrp: 2199,
    fabric: "Cotton poplin",
    fit: "Slim / tailored",
    care: "Machine wash cold. Warm iron. Hang dry.",
    styling: "Wear open-collar casual, or with a black tie for meetings and evenings.",
    description:
      "A crisp light-blue long-sleeve dress shirt with a clean pointed collar and tailored line. Studio-ready for work, dinners, and smart weekends — sharp alone or with a slim black tie.",
    images: [
      { url: "/products/urbanthread-sky-blue-shirt-1.jpg", alt: "UrbanThread Sky Blue Dress Shirt — styled" },
      { url: "/products/urbanthread-sky-blue-shirt-2.jpg", alt: "UrbanThread Sky Blue Dress Shirt — profile" },
      { url: "/products/urbanthread-sky-blue-shirt-3.jpg", alt: "UrbanThread Sky Blue Dress Shirt — back" },
      { url: "/products/urbanthread-sky-blue-shirt-4.jpg", alt: "UrbanThread Sky Blue Dress Shirt — product" },
    ],
  },
];

async function insertId(result: [{ insertId: number }, unknown]) {
  return Number(result[0].insertId);
}

async function upsertLook(look: Spec, adminId: number | null) {
  const [brand] = await db.select().from(brands).where(eq(brands.name, look.brand)).limit(1);
  if (!brand) throw new Error(`${look.brand} brand missing — run seed first`);

  const [cat] = await db.select().from(categories).where(eq(categories.slug, look.categorySlug)).limit(1);
  if (!cat) throw new Error(`Category ${look.categorySlug} missing`);

  let extra: typeof cat | undefined;
  if (look.extraCategorySlug) {
    const [row] = await db.select().from(categories).where(eq(categories.slug, look.extraCategorySlug)).limit(1);
    extra = row;
  }

  const slug = toSlug(look.name);
  const [existing] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

  const payload = {
    name: look.name,
    description: look.description,
    brandId: brand.id,
    status: "PUBLISHED" as const,
    gender: look.gender,
    isFeatured: true,
    isNew: true,
    seoTitle: `${look.name} | ${look.brand} | Nexperts`,
    seoDescription: look.description.slice(0, 155),
    specifications: {
      Brand: look.brand,
      Gender: look.gender,
      Category: cat.name,
      Fabric: look.fabric,
      Fit: look.fit,
      Care: look.care,
      Styling: look.styling,
    },
    shippingInfo: "Ships within 24–48 hours. Free shipping on orders above RM 999.",
    returnInfo: "7-day easy returns on unused items with tags attached.",
  };

  let productId = existing?.id;
  if (existing) {
    await db.update(products).set(payload).where(eq(products.id, existing.id));
  } else {
    productId = await insertId(await db.insert(products).values({ ...payload, slug }));
  }

  await db.delete(productCategories).where(eq(productCategories.productId, productId!));
  const cats = [{ productId: productId!, categoryId: cat.id }];
  if (extra) cats.push({ productId: productId!, categoryId: extra.id });
  await db.insert(productCategories).values(cats);

  await db.delete(productImages).where(eq(productImages.productId, productId!));
  await db.insert(productImages).values(
    look.images.map((img, i) => ({
      productId: productId!,
      url: img.url,
      storageKey: `catalog/${look.sku}-${i + 1}.jpg`,
      alt: img.alt,
      sortOrder: i,
      isPrimary: i === 0,
    })),
  );

  const existingVariants = await db.select().from(productVariants).where(eq(productVariants.productId, productId!));
  for (const [index, size] of SIZES.entries()) {
    const sku = `${look.sku}-${size}`;
    const found = existingVariants.find((v) => v.sku === sku);
    let variantId = found?.id;
    if (found) {
      await db
        .update(productVariants)
        .set({
          name: size,
          attributes: { size, gender: look.gender },
          price: String(look.price),
          mrp: String(look.mrp),
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
          attributes: { size, gender: look.gender },
          price: String(look.price),
          mrp: String(look.mrp),
          isDefault: index === 0,
        }),
      );
      await db.insert(inventory).values({ variantId: variantId!, stock: 24, reservedStock: 0, reorderLevel: 4 });
      if (adminId) {
        await db.insert(inventoryTransactions).values({
          variantId: variantId!,
          previousStock: 0,
          newStock: 24,
          difference: 24,
          reason: "PURCHASE",
          adminUserId: adminId,
          notes: "Featured look initial stock",
        });
      }
    }
    const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, variantId!)).limit(1);
    if (inv && inv.stock < 8) {
      await db.update(inventory).set({ stock: 24 }).where(eq(inventory.variantId, variantId!));
    }
  }

  return { productId, slug, gender: look.gender, pdp: `/products/${slug}` };
}

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@nexpertsacademy.com")).limit(1);
  const adminId = admin?.id ?? null;
  const results = [];
  for (const look of LOOKS) {
    results.push(await upsertLook(look, adminId));
  }
  console.log(JSON.stringify({ ok: true, products: results }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
