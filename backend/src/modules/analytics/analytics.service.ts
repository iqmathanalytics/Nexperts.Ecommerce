import { pool } from "../../db";
import { toMoney } from "../../utils/money";

function range(period: string) {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  else if (period === "7d") start.setDate(now.getDate() - 7);
  else if (period === "30d") start.setDate(now.getDate() - 30);
  else if (period === "90d") start.setDate(now.getDate() - 90);
  else start.setMonth(0, 1);
  return start;
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDayKey(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return ymd(value);
  const s = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? s.slice(0, 10) : ymd(parsed);
}

function fillDailySeries(start: Date, rows: Array<Record<string, unknown>>, fields: string[]) {
  const map = new Map(rows.map((row) => [toDayKey(row.day), row]));
  const out: Array<Record<string, unknown>> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const day = ymd(cursor);
    const row = map.get(day) ?? {};
    const point: Record<string, unknown> = { day };
    for (const field of fields) {
      point[field] = Number(row[field] ?? 0);
    }
    out.push(point);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function namedCounts(rows: unknown, nameKey: string, valueKey: string) {
  return (rows as Array<Record<string, unknown>>).map((row) => ({
    name: String(row[nameKey] ?? ""),
    units: Number(row[valueKey] ?? 0),
    revenue: row.revenue != null ? toMoney(Number(row.revenue)) : undefined,
  }));
}

export async function dashboard(period = "30d") {
  const start = range(period);
  const [
    [kpis],
    [customers],
    [pendingOrders],
    [pendingReviews],
    [stock],
    [revenueSeries],
    [topProducts],
    [topCategories],
    [growth],
    [statusRows],
  ] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total END), 0) AS aov,
        COALESCE((
          SELECT SUM(oi.quantity) FROM order_items oi
          INNER JOIN orders ox ON ox.id = oi.order_id
          WHERE ox.created_at >= ? AND ox.status != 'CANCELLED'
        ), 0) AS units
       FROM orders
       WHERE created_at >= ?`,
      [start, start],
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'CUSTOMER' AND u.status = 'ACTIVE'`,
    ),
    pool.query(`SELECT COUNT(*) AS total FROM orders WHERE status IN ('PENDING','CONFIRMED')`),
    pool.query(`SELECT COUNT(*) AS total FROM reviews WHERE status = 'PENDING'`),
    pool.query(`
      SELECT
        SUM(CASE WHEN (i.stock - i.reserved_stock) > 0 AND (i.stock - i.reserved_stock) <= i.reorder_level THEN 1 ELSE 0 END) AS lowStock,
        SUM(CASE WHEN (i.stock - i.reserved_stock) <= 0 THEN 1 ELSE 0 END) AS outOfStock
      FROM inventory i
      INNER JOIN product_variants v ON v.id = i.variant_id
      INNER JOIN products p ON p.id = v.product_id
      WHERE v.status = 'ACTIVE' AND p.status = 'PUBLISHED'
    `),
    pool.query(
      `SELECT DATE(created_at) AS day, COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END),0) AS revenue,
              COUNT(*) AS orders
       FROM orders WHERE created_at >= ?
       GROUP BY DATE(created_at) ORDER BY day`,
      [start],
    ),
    pool.query(
      `SELECT p.name, SUM(oi.quantity) AS units, SUM(oi.total) AS revenue
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= ? AND o.status != 'CANCELLED'
       GROUP BY p.id ORDER BY units DESC LIMIT 8`,
      [start],
    ),
    pool.query(
      `SELECT c.name, SUM(oi.quantity) AS units
       FROM order_items oi
       INNER JOIN product_categories pc ON pc.product_id = oi.product_id
       INNER JOIN categories c ON c.id = pc.category_id
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= ? AND o.status != 'CANCELLED'
       GROUP BY c.id ORDER BY units DESC LIMIT 8`,
      [start],
    ),
    pool.query(
      `SELECT DATE(u.created_at) AS day, COUNT(*) AS customers
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id AND r.name = 'CUSTOMER'
       WHERE u.created_at >= ?
       GROUP BY DATE(u.created_at) ORDER BY day`,
      [start],
    ),
    pool.query(
      `SELECT status, COUNT(*) AS count FROM orders WHERE created_at >= ? GROUP BY status ORDER BY count DESC`,
      [start],
    ),
  ]);
  const kpi = (kpis as Array<Record<string, number>>)[0] ?? {};
  const st = (stock as Array<Record<string, number>>)[0] ?? {};
  const revenueOverTime = fillDailySeries(start, revenueSeries as Array<Record<string, unknown>>, ["revenue", "orders"]);
  return {
    kpis: {
      revenue: toMoney(kpi.revenue ?? 0),
      orders: Number(kpi.orders ?? 0),
      customers: Number((customers as Array<{ total: number }>)[0]?.total ?? 0),
      productsSold: Number(kpi.units ?? 0),
      aov: toMoney(kpi.aov ?? 0),
      lowStock: Number(st.lowStock ?? 0),
      outOfStock: Number(st.outOfStock ?? 0),
      pendingOrders: Number((pendingOrders as Array<{ total: number }>)[0]?.total ?? 0),
      pendingReviews: Number((pendingReviews as Array<{ total: number }>)[0]?.total ?? 0),
    },
    revenueOverTime,
    ordersOverTime: revenueOverTime,
    topProducts: namedCounts(topProducts, "name", "units"),
    topCategories: namedCounts(topCategories, "name", "units"),
    customerGrowth: fillDailySeries(start, growth as Array<Record<string, unknown>>, ["customers"]),
    ordersByStatus: (statusRows as Array<{ status: string; count: number }>).map((row) => ({
      name: row.status,
      value: Number(row.count ?? 0),
    })),
  };
}

export async function salesAnalytics(period = "30d") {
  const start = range(period);
  const [[rows], [units]] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END), 0) AS grossRevenue,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total - tax ELSE 0 END), 0) AS netRevenue,
        COUNT(*) AS orders,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN discount ELSE 0 END), 0) AS discounts,
        COALESCE(SUM(CASE WHEN payment_status = 'REFUNDED' THEN total ELSE 0 END), 0) AS refunds,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total END), 0) AS aov
       FROM orders WHERE created_at >= ?`,
      [start],
    ),
    pool.query(
      `SELECT COALESCE(SUM(oi.quantity),0) AS units
       FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= ? AND o.status != 'CANCELLED'`,
      [start],
    ),
  ]);
  const s = (rows as Array<Record<string, number>>)[0] ?? {};
  return {
    grossRevenue: toMoney(s.grossRevenue ?? 0),
    netRevenue: toMoney(s.netRevenue ?? 0),
    orders: Number(s.orders ?? 0),
    unitsSold: Number((units as Array<{ units: number }>)[0]?.units ?? 0),
    discounts: toMoney(s.discounts ?? 0),
    refunds: toMoney(s.refunds ?? 0),
    aov: toMoney(s.aov ?? 0),
  };
}
