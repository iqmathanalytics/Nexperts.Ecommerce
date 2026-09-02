import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, pool } from "../../db";
import { inventory, inventoryTransactions } from "../../db/schema";
import { AppError } from "../../utils/http";
import { audit } from "../../utils/audit";
import { toMoney } from "../../utils/money";

export const TRANSACTION_REASONS = [
  "PURCHASE",
  "MANUAL_ADJUSTMENT",
  "DAMAGE",
  "RETURN",
  "CORRECTION",
  "SALE",
  "RESERVE",
  "RELEASE",
] as const;

export const adjustSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().refine((n) => n !== 0, "Adjustment quantity cannot be zero"),
  reason: z.enum(["PURCHASE", "MANUAL_ADJUSTMENT", "DAMAGE", "RETURN", "CORRECTION"]),
  notes: z.string().max(500).optional(),
});

export async function setStockWithAudit(
  adminId: number,
  variantId: number,
  newStock: number,
  notes: string,
  ip?: string,
  reorderLevel?: number,
) {
  const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, variantId)).limit(1);
  if (!inv) return;
  const previous = inv.stock;
  if (previous === newStock && reorderLevel == null) return;
  if (newStock < inv.reservedStock) {
    throw new AppError("NEGATIVE_STOCK", "Stock cannot fall below reserved quantity", 400);
  }
  await db
    .update(inventory)
    .set({
      stock: newStock,
      ...(reorderLevel != null ? { reorderLevel } : {}),
    })
    .where(eq(inventory.variantId, variantId));
  if (previous !== newStock) {
    await db.insert(inventoryTransactions).values({
      variantId,
      previousStock: previous,
      newStock,
      difference: newStock - previous,
      reason: "MANUAL_ADJUSTMENT",
      adminUserId: adminId,
      notes,
    });
    await audit({
      adminUserId: adminId,
      action: "INVENTORY_CHANGED",
      resource: "inventory",
      resourceId: variantId,
      metadata: { previousStock: previous, newStock, source: "product_editor" },
      ip,
    });
  }
}

export async function listInventory(filter?: "low" | "out" | "all", q?: string) {
  let extra = "";
  const params: unknown[] = [];
  if (filter === "low") extra += " AND i.stock > 0 AND (i.stock - i.reserved_stock) <= i.reorder_level";
  if (filter === "out") extra += " AND (i.stock - i.reserved_stock) <= 0";
  if (q) {
    extra += " AND (p.name LIKE ? OR v.sku LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  const [rows] = await pool.query(
    `SELECT i.id, i.variant_id AS variantId, i.stock, i.reserved_stock AS reservedStock, i.reorder_level AS reorderLevel,
            (i.stock - i.reserved_stock) AS availableStock, v.sku, v.name AS variantName, v.price, p.name AS productName, p.id AS productId
     FROM inventory i
     INNER JOIN product_variants v ON v.id = i.variant_id
     INNER JOIN products p ON p.id = v.product_id
     WHERE v.status = 'ACTIVE' AND p.status = 'PUBLISHED' ${extra}
     ORDER BY availableStock ASC, p.name ASC`,
    params,
  );
  return (rows as Array<Record<string, unknown>>).map((row) => {
    const stock = Number(row.stock ?? 0);
    const reservedStock = Number(row.reservedStock ?? 0);
    const availableStock = Number(row.availableStock ?? stock - reservedStock);
    const price = toMoney(row.price as string | number);
    return {
      ...row,
      stock,
      reservedStock,
      availableStock,
      reorderLevel: Number(row.reorderLevel ?? 0),
      price,
      value: toMoney(Math.max(0, availableStock) * price),
    };
  });
}

export async function adjustStock(adminId: number, input: z.infer<typeof adjustSchema>, ip?: string) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT * FROM inventory WHERE variant_id = ? FOR UPDATE", [input.variantId]);
    const inv = (rows as Array<{ id: number; stock: number; reserved_stock: number }>)[0];
    if (!inv) throw new AppError("NOT_FOUND", "Inventory record not found", 404);
    const newStock = inv.stock + input.quantity;
    if (newStock < 0) throw new AppError("NEGATIVE_STOCK", "Stock cannot become negative", 400);
    if (newStock < inv.reserved_stock) {
      throw new AppError("NEGATIVE_STOCK", "Stock cannot fall below reserved quantity", 400);
    }
    await conn.query("UPDATE inventory SET stock = ? WHERE id = ?", [newStock, inv.id]);
    await conn.query(
      `INSERT INTO inventory_transactions
        (variant_id, previous_stock, new_stock, difference, reason, admin_user_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.variantId, inv.stock, newStock, input.quantity, input.reason, adminId, input.notes ?? null],
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  await audit({
    adminUserId: adminId,
    action: "INVENTORY_CHANGED",
    resource: "inventory",
    resourceId: input.variantId,
    metadata: input,
    ip,
  });
  const [row] = await db.select().from(inventory).where(eq(inventory.variantId, input.variantId)).limit(1);
  return row;
}

export async function listTransactions(filters: {
  variantId?: number;
  q?: string;
  reason?: string;
  from?: string;
  to?: string;
} = {}) {
  let extra = "WHERE 1=1";
  const params: unknown[] = [];
  if (filters.variantId) {
    extra += " AND t.variant_id = ?";
    params.push(filters.variantId);
  }
  if (filters.q) {
    extra += " AND (p.name LIKE ? OR v.sku LIKE ?)";
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.reason && TRANSACTION_REASONS.includes(filters.reason as (typeof TRANSACTION_REASONS)[number])) {
    extra += " AND t.reason = ?";
    params.push(filters.reason);
  }
  if (filters.from) {
    extra += " AND t.created_at >= ?";
    params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    extra += " AND t.created_at < DATE_ADD(?, INTERVAL 1 DAY)";
    params.push(filters.to);
  }
  const [rows] = await pool.query(
    `SELECT t.id, t.variant_id AS variantId, t.previous_stock AS previousStock, t.new_stock AS newStock,
            t.difference, t.reason, t.notes, t.created_at AS createdAt, v.sku, p.name AS productName
     FROM inventory_transactions t
     INNER JOIN product_variants v ON v.id = t.variant_id
     INNER JOIN products p ON p.id = v.product_id
     ${extra}
     ORDER BY t.created_at DESC
     LIMIT 500`,
    params,
  );
  return rows;
}

export async function inventoryAnalytics() {
  const [rows] = await pool.query(`
    SELECT
      COALESCE(SUM(GREATEST(i.stock - i.reserved_stock, 0)), 0) AS totalStock,
      SUM(CASE WHEN (i.stock - i.reserved_stock) > i.reorder_level THEN 1 ELSE 0 END) AS healthyStock,
      SUM(CASE WHEN (i.stock - i.reserved_stock) > 0 AND (i.stock - i.reserved_stock) <= i.reorder_level THEN 1 ELSE 0 END) AS lowStock,
      SUM(CASE WHEN (i.stock - i.reserved_stock) <= 0 THEN 1 ELSE 0 END) AS outOfStock,
      COALESCE(SUM(GREATEST(i.stock - i.reserved_stock, 0) * v.price), 0) AS inventoryValue
    FROM inventory i
    INNER JOIN product_variants v ON v.id = i.variant_id
    INNER JOIN products p ON p.id = v.product_id
    WHERE v.status = 'ACTIVE' AND p.status = 'PUBLISHED'
  `);
  const summary = (rows as Array<Record<string, number>>)[0];
  const [best] = await pool.query(`
    SELECT p.name, p.id, SUM(oi.quantity) AS units
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'CANCELLED'
    GROUP BY p.id
    ORDER BY units DESC
    LIMIT 8
  `);
  const [slow] = await pool.query(`
    SELECT p.name, p.id, i.stock
    FROM inventory i
    INNER JOIN product_variants v ON v.id = i.variant_id
    INNER JOIN products p ON p.id = v.product_id
    LEFT JOIN order_items oi ON oi.variant_id = v.id
    WHERE oi.id IS NULL AND i.stock > 0
    LIMIT 8
  `);
  return {
    totalStock: Number(summary?.totalStock ?? 0),
    healthyStock: Number(summary?.healthyStock ?? 0),
    lowStock: Number(summary?.lowStock ?? 0),
    outOfStock: Number(summary?.outOfStock ?? 0),
    inventoryValue: toMoney(summary?.inventoryValue ?? 0),
    bestSelling: (best as Array<{ name: string; id: number; units: number }>).map((row) => ({
      name: row.name,
      units: Number(row.units ?? 0),
    })),
    slowMoving: (slow as Array<{ name: string; id: number; stock: number }>).map((row) => ({
      name: row.name,
      units: Number(row.stock ?? 0),
    })),
  };
}
