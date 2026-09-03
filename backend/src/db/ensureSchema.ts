import { pool } from "./index";
import { CATEGORY_IMAGES } from "./catalogData";
import { invalidateStorefrontCache } from "../utils/ttlCache";

const OPTIONAL_COLUMNS = [
  "ALTER TABLE brands ADD COLUMN lookbook_bio TEXT NULL",
  "ALTER TABLE brands ADD COLUMN hero_image_url VARCHAR(500) NULL",
  "ALTER TABLE reviews ADD COLUMN fit_feedback ENUM('SMALL','TRUE','LARGE') NULL",
];

const OPTIONAL_INDEXES = [
  "CREATE INDEX idx_variants_product_default_status ON product_variants (product_id, is_default, status)",
  "CREATE INDEX idx_reviews_product_status ON reviews (product_id, status)",
  "CREATE INDEX idx_products_status_featured_created ON products (status, is_featured, created_at)",
  "CREATE INDEX idx_products_status_gender_created ON products (status, gender, created_at)",
  "CREATE INDEX idx_orders_user_created ON orders (user_id, created_at)",
  "CREATE INDEX idx_product_images_product_primary ON product_images (product_id, is_primary, sort_order)",
];

export async function ensureSchema() {
  for (const sql of OPTIONAL_COLUMNS) {
    try {
      await pool.query(sql);
    } catch (err) {
      const errno = (err as { errno?: number }).errno;
      if (errno === 1060) continue;
      console.warn("ensureSchema skipped:", (err as Error).message);
    }
  }
  for (const sql of OPTIONAL_INDEXES) {
    try {
      await pool.query(sql);
    } catch (err) {
      const errno = (err as { errno?: number }).errno;
      if (errno === 1061) continue;
      console.warn("ensureSchema index skipped:", (err as Error).message);
    }
  }
  try {
    await ensureMenDepartments();
  } catch (err) {
    console.warn("ensureMenDepartments skipped:", (err as Error).message);
  }
}

type CatRow = { id: number; slug: string };

async function ensureMenDepartments() {
  const kids: Array<{ parent: string; name: string; slug: string; imageKey: string }> = [
    { parent: "tops", name: "Shirts", slug: "shirts", imageKey: "Shirts" },
    { parent: "tops", name: "T-Shirts", slug: "t-shirts", imageKey: "T-Shirts" },
    { parent: "bottoms", name: "Trousers", slug: "trousers", imageKey: "Trousers" },
    { parent: "outerwear", name: "Jackets", slug: "jackets", imageKey: "Jackets" },
  ];

  const [parents] = await pool.query<CatRow[]>("SELECT id, slug FROM categories WHERE slug IN ('tops','bottoms','outerwear')");
  const parentId = (slug: string) => parents.find((p) => p.slug === slug)?.id;

  for (const kid of kids) {
    const pid = parentId(kid.parent);
    if (!pid) continue;
    const image = CATEGORY_IMAGES[kid.imageKey] ?? null;
    const [existing] = await pool.query<CatRow[]>("SELECT id, slug FROM categories WHERE slug = ? LIMIT 1", [kid.slug]);
    if (!existing.length) {
      await pool.query(
        `INSERT INTO categories (name, slug, parent_id, description, seo_title, seo_description, image_url, sort_order, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVE')`,
        [
          kid.name,
          kid.slug,
          pid,
          `${kid.name} for the Nexperts man collection.`,
          `${kid.name} | Nexperts`,
          `Shop ${kid.name.toLowerCase()} online at Nexperts.`,
          image,
        ],
      );
    }
    await pool.query(`UPDATE categories SET status = 'ACTIVE', parent_id = ? WHERE slug = ?`, [pid, kid.slug]);
  }

  const [childRows] = await pool.query<CatRow[]>(
    "SELECT id, slug FROM categories WHERE slug IN ('shirts','t-shirts','trousers','jackets')",
  );
  const idOf = (slug: string) => childRows.find((r) => r.slug === slug)?.id;
  const shirtsId = idOf("shirts");
  const tshirtsId = idOf("t-shirts");
  const trousersId = idOf("trousers");
  const jacketsId = idOf("jackets");

  if (shirtsId) {
    await pool.query(
      `INSERT IGNORE INTO product_categories (product_id, category_id)
       SELECT DISTINCT p.id, ?
       FROM products p
       INNER JOIN product_categories pc ON pc.product_id = p.id
       INNER JOIN categories c ON c.id = pc.category_id AND c.slug IN ('tops', 'shirts')
       WHERE p.gender = 'MEN'
         AND LOWER(p.name) LIKE '%shirt%'
         AND LOWER(p.name) NOT LIKE '%t-shirt%'
         AND LOWER(p.name) NOT LIKE '%t shirt%'`,
      [shirtsId],
    );
  }
  if (tshirtsId) {
    await pool.query(
      `INSERT IGNORE INTO product_categories (product_id, category_id)
       SELECT DISTINCT p.id, ?
       FROM products p
       INNER JOIN product_categories pc ON pc.product_id = p.id
       INNER JOIN categories c ON c.id = pc.category_id AND c.slug IN ('tops', 't-shirts')
       WHERE p.gender = 'MEN'
         AND (LOWER(p.name) LIKE '%t-shirt%' OR LOWER(p.name) LIKE '%t shirt%' OR LOWER(p.name) LIKE '% tee %' OR LOWER(p.name) LIKE '%tee')`,
      [tshirtsId],
    );
  }
  if (trousersId) {
    await pool.query(
      `INSERT IGNORE INTO product_categories (product_id, category_id)
       SELECT DISTINCT p.id, ?
       FROM products p
       INNER JOIN product_categories pc ON pc.product_id = p.id
       INNER JOIN categories c ON c.id = pc.category_id AND c.slug IN ('bottoms', 'trousers')
       WHERE p.gender = 'MEN'`,
      [trousersId],
    );
  }
  if (jacketsId) {
    await pool.query(
      `INSERT IGNORE INTO product_categories (product_id, category_id)
       SELECT DISTINCT p.id, ?
       FROM products p
       INNER JOIN product_categories pc ON pc.product_id = p.id
       INNER JOIN categories c ON c.id = pc.category_id AND c.slug IN ('outerwear', 'jackets')
       WHERE p.gender = 'MEN'`,
      [jacketsId],
    );
  }

  invalidateStorefrontCache();
}

export function keepDatabaseWarm() {
  const ping = () => {
    pool.query("SELECT 1").catch(() => undefined);
  };
  ping();
  const timer = setInterval(ping, 20_000);
  timer.unref?.();
}
