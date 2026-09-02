import { pool } from "./index";

const OPTIONAL_COLUMNS = [
  "ALTER TABLE brands ADD COLUMN lookbook_bio TEXT NULL",
  "ALTER TABLE brands ADD COLUMN hero_image_url VARCHAR(500) NULL",
  "ALTER TABLE reviews ADD COLUMN fit_feedback ENUM('SMALL','TRUE','LARGE') NULL",
];

const OPTIONAL_INDEXES = [
  "CREATE INDEX idx_variants_product_default_status ON product_variants (product_id, is_default, status)",
  "CREATE INDEX idx_reviews_product_status ON reviews (product_id, status)",
  "CREATE INDEX idx_products_status_featured_created ON products (status, is_featured, created_at)",
  "CREATE INDEX idx_products_status_gender ON products (status, gender)",
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
}

export function keepDatabaseWarm() {
  const ping = () => {
    pool.query("SELECT 1").catch(() => undefined);
  };
  ping();
  const timer = setInterval(ping, 20_000);
  timer.unref?.();
}
