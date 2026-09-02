import { pool } from "./index";
import { CATALOG, CATEGORY_IMAGES, SIZES, px, u } from "./catalogData";

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const [adminRows] = await pool.query("SELECT id FROM users LIMIT 1");
  const adminId = Number((adminRows as Array<{ id: number }>)[0]?.id ?? 1);

  const [brandRows] = await pool.query("SELECT id, name FROM brands");
  const brandIds = new Map((brandRows as Array<{ id: number; name: string }>).map((b) => [b.name, b.id]));

  const [catRows] = await pool.query("SELECT id, name FROM categories");
  const catIds = new Map((catRows as Array<{ id: number; name: string }>).map((c) => [c.name, c.id]));

  let updated = 0;
  let created = 0;

  for (const item of CATALOG) {
    const slug = slugify(item.name);
    const specs = JSON.stringify({
      Brand: item.brand,
      Gender: item.gender,
      Category: item.category,
      Fabric: item.fabric,
      Fit: item.fit,
      Care: item.care ?? "Gentle wash · Dry clean recommended for evening wear",
      Origin: item.origin ?? "Designed in-house",
      Styling: item.styling ?? "Style with Nexperts essentials.",
      Model: item.model ?? "True to size",
    });
    const images = [
      { url: item.image, key: `catalog/${item.sku}-1.jpg`, alt: item.name, sort: 0, primary: 1 },
      { url: item.image2, key: `catalog/${item.sku}-2.jpg`, alt: `${item.name} alternate`, sort: 1, primary: 0 },
      ...(item.image3
        ? [{ url: item.image3, key: `catalog/${item.sku}-3.jpg`, alt: `${item.name} detail`, sort: 2, primary: 0 }]
        : []),
    ];

    const [existingRows] = await pool.query("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
    const existing = (existingRows as Array<{ id: number }>)[0];

    if (existing) {
      await pool.query(
        `UPDATE products
         SET description = ?, specifications = ?, shipping_info = ?, return_info = ?
         WHERE id = ?`,
        [
          item.description,
          specs,
          "Ships within 24–48 hours. Free shipping on orders above RM 999. Premium packaging on every order.",
          "7-day easy returns on unused items with tags attached.",
          existing.id,
        ],
      );
      await pool.query("DELETE FROM product_images WHERE product_id = ?", [existing.id]);
      for (const img of images) {
        await pool.query(
          `INSERT INTO product_images (product_id, url, storage_key, alt, sort_order, is_primary)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [existing.id, img.url, img.key, img.alt, img.sort, img.primary],
        );
      }
      updated += 1;
      continue;
    }

    const [insertResult] = await pool.query(
      `INSERT INTO products
        (name, slug, description, brand_id, status, gender, seo_title, seo_description, specifications, shipping_info, return_info, is_featured, is_new)
       VALUES (?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        item.name,
        slug,
        item.description,
        brandIds.get(item.brand) ?? null,
        item.gender,
        `${item.name} | ${item.brand} | Nexperts`,
        `${item.description.slice(0, 140)}…`,
        specs,
        "Ships within 24–48 hours. Free shipping on orders above RM 999.",
        "7-day easy returns on unused items with tags attached.",
      ],
    );
    const pid = Number((insertResult as { insertId: number }).insertId);

    for (const catName of [item.category, item.extraCategory]) {
      const catId = catName ? catIds.get(catName) : undefined;
      if (!catId) continue;
      await pool.query("INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)", [pid, catId]);
    }

    for (const img of images) {
      await pool.query(
        `INSERT INTO product_images (product_id, url, storage_key, alt, sort_order, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pid, img.url, img.key, img.alt, img.sort, img.primary],
      );
    }

    for (const [index, size] of SIZES.entries()) {
      const [vRes] = await pool.query(
        `INSERT INTO product_variants (product_id, sku, name, attributes, price, mrp, is_default, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [pid, `${item.sku}-${size}`, size, JSON.stringify({ size, gender: item.gender }), item.price, item.mrp, index === 0 ? 1 : 0],
      );
      const vid = Number((vRes as { insertId: number }).insertId);
      await pool.query(
        "INSERT INTO inventory (variant_id, stock, reserved_stock, reorder_level) VALUES (?, 16, 0, 4)",
        [vid],
      );
      await pool.query(
        `INSERT INTO inventory_transactions
          (variant_id, previous_stock, new_stock, difference, reason, admin_user_id, notes)
         VALUES (?, 0, 16, 16, 'PURCHASE', ?, 'Catalog refresh')`,
        [vid, adminId],
      );
    }
    created += 1;
  }

  async function tryQuery(sql: string, params: unknown[]) {
    try {
      await pool.query(sql, params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Skipped optional media update: ${message}`);
    }
  }

  await tryQuery("UPDATE collections SET image_url = ? WHERE slug = ?", [
    u("photo-1539008835657-9e8e9680c956"),
    "summer-linen-edit",
  ]);
  await tryQuery("UPDATE collections SET image_url = ? WHERE slug = ?", [
    u("photo-1572804013309-59a88b7e92f1"),
    "festive-glow",
  ]);
  await tryQuery("UPDATE lookbooks SET cover_image_url = ? WHERE slug = ?", [
    px(31808831),
    "petal-resort-2026",
  ]);
  await tryQuery("UPDATE brands SET hero_image_url = ? WHERE name = ?", [
    u("photo-1595777457583-95e059d581b8"),
    "Petal",
  ]);
  await tryQuery("DELETE FROM settings WHERE `key` = ?", ["storefront.editorial"]);

  for (const [name, url] of Object.entries(CATEGORY_IMAGES)) {
    await tryQuery("UPDATE categories SET image_url = ? WHERE name = ?", [url, name]);
  }

  await pool.end();
  console.log(`Catalog media refreshed. Updated ${updated}, created ${created}.`);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
