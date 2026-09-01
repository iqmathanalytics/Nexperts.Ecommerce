import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, pool } from "../../db";
import {
  addresses,
  inventory,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  productImages,
  productVariants,
  products,
  users,
} from "../../db/schema";
import { AppError } from "../../utils/http";
import { computeTotals, toMoney } from "../../utils/money";
import { env } from "../../config/env";
import { getPaymentProvider, isOnlinePaymentEnabled } from "../../utils/payments";
import { previewCoupon, lockAndValidateCoupon, recordCouponUsage } from "../coupons/coupon.service";
import { getCart } from "../cart/cart.service";
import { audit } from "../../utils/audit";
import { sendOrderConfirmationEmail } from "../../utils/email";

const CANCELABLE = ["PENDING", "CONFIRMED", "PROCESSING"] as const;
const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const checkoutSchema = z.object({
  addressId: z.number().int().positive(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
  notes: z.string().max(500).optional(),
});

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT id, last_number FROM order_counters WHERE year = ? FOR UPDATE", [year]);
    const row = (rows as Array<{ id: number; last_number: number }>)[0];
    let next = 1;
    if (!row) {
      await conn.query("INSERT INTO order_counters (year, last_number) VALUES (?, 1)", [year]);
    } else {
      next = row.last_number + 1;
      await conn.query("UPDATE order_counters SET last_number = ? WHERE id = ?", [next, row.id]);
    }
    await conn.commit();
    return `ORD-${year}-${String(next).padStart(6, "0")}`;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function quoteCheckout(userId: number, couponCode?: string) {
  const cart = await getCart(userId);
  if (!cart.items.length) throw new AppError("EMPTY_CART", "Your cart is empty", 400);
  if (cart.issues.length) throw new AppError("CART_INVALID", cart.issues[0] ?? "Cart is invalid", 400);
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const preview = await previewCoupon(userId, couponCode, cart.subtotal);
    discount = preview.discount;
    coupon = { code: preview.coupon.code, type: preview.coupon.type, discount };
  }
  const shipping = cart.subtotal - discount >= env.FREE_SHIPPING_MIN ? 0 : env.SHIPPING_FLAT;
  const totals = computeTotals({ subtotal: cart.subtotal, discount, taxRate: env.TAX_RATE, shipping });
  return { cart, coupon, shipping, taxRate: env.TAX_RATE, ...totals, discount };
}

export async function placeOrder(userId: number, input: z.infer<typeof checkoutSchema>) {
  if (input.paymentMethod === "ONLINE" && !isOnlinePaymentEnabled()) {
    throw new AppError("PAYMENT_UNAVAILABLE", "Online payment is not available yet", 400);
  }
  const quote = await quoteCheckout(userId, input.couponCode);
  const [address] = await db.select().from(addresses).where(and(eq(addresses.id, input.addressId), eq(addresses.userId, userId))).limit(1);
  if (!address) throw new AppError("NOT_FOUND", "Address not found", 404);

  const conn = await pool.getConnection();
  const orderNumber = await nextOrderNumber();
  try {
    await conn.beginTransaction();
    for (const item of quote.cart.items) {
      const [rows] = await conn.query("SELECT stock, reserved_stock FROM inventory WHERE variant_id = ? FOR UPDATE", [item.variantId]);
      const inv = (rows as Array<{ stock: number; reserved_stock: number }>)[0];
      if (!inv) throw new AppError("OUT_OF_STOCK", `No inventory for ${item.sku}`, 400);
      const available = inv.stock - inv.reserved_stock;
      if (available < item.quantity) throw new AppError("OUT_OF_STOCK", `Not enough stock for ${item.name}`, 400);
      await conn.query("UPDATE inventory SET reserved_stock = reserved_stock + ? WHERE variant_id = ?", [item.quantity, item.variantId]);
      await conn.query(
        `INSERT INTO inventory_transactions (variant_id, previous_stock, new_stock, difference, reason, notes)
         VALUES (?, ?, ?, 0, 'RESERVE', ?)`,
        [item.variantId, inv.stock, inv.stock, `Reserved ${item.quantity} for ${orderNumber}`],
      );
    }

    let couponId: number | null = null;
    if (quote.coupon) {
      const locked = await lockAndValidateCoupon(conn, userId, quote.coupon.code, quote.cart.subtotal);
      if (locked.discount !== quote.discount) {
        throw new AppError("INVALID_COUPON", "Coupon is no longer valid for this cart", 400);
      }
      couponId = locked.couponId;
    }

    const [orderRes] = await conn.query(
      `INSERT INTO orders
        (order_number, user_id, status, payment_status, subtotal, discount, tax, shipping, total, coupon_id, coupon_code, shipping_address, notes)
       VALUES (?, ?, 'PENDING', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        quote.cart.subtotal,
        quote.discount,
        quote.tax,
        quote.shipping,
        quote.total,
        couponId,
        quote.coupon?.code ?? null,
        JSON.stringify({
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        }),
        input.notes ?? null,
      ],
    );
    const orderId = Number((orderRes as { insertId: number }).insertId);

    for (const item of quote.cart.items) {
      const line = toMoney(item.price * item.quantity);
      await conn.query(
        `INSERT INTO order_items
          (order_id, product_id, variant_id, product_name, sku, variant_name, image_url, quantity, unit_price, mrp, discount, tax, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
        [orderId, item.productId, item.variantId, item.name, item.sku, item.variantName, item.imageUrl, item.quantity, item.price, item.mrp, line],
      );
    }

    if (quote.coupon && couponId) {
      await recordCouponUsage(conn, couponId, userId, orderId, quote.discount);
    }

    const payment = await getPaymentProvider(input.paymentMethod).createPayment({
      orderNumber,
      amount: quote.total,
      method: input.paymentMethod,
    });
    await conn.query(
      `INSERT INTO payments (order_id, provider, method, status, amount, currency, provider_ref, metadata)
       VALUES (?, ?, ?, ?, ?, 'INR', ?, ?)`,
      [orderId, payment.provider, payment.method, payment.status, quote.total, payment.providerRef, JSON.stringify(payment.metadata ?? {})],
    );
    await conn.query(
      "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note) VALUES (?, NULL, 'PENDING', ?, 'Order placed')",
      [orderId, userId],
    );
    await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [quote.cart.id]);
    await conn.commit();
    const order = await getOrderById(orderId, userId);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      void sendOrderConfirmationEmail({
        email: user.email,
        firstName: user.firstName,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        orderId: order.id,
      }).catch((err) => console.error("Failed to send order confirmation email", err));
    }
    return order;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getOrderById(orderId: number, userId?: number, isAdmin = false) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (!isAdmin && userId && order.userId !== userId) throw new AppError("FORBIDDEN", "Not your order", 403);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId));
  const pays = await db.select().from(payments).where(eq(payments.orderId, orderId));
  return { ...order, items, history, payments: pays };
}

export async function listCustomerOrders(userId: number) {
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  const ids = rows.map((r) => r.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.id) }));
}

export async function cancelOrder(orderId: number, actorId: number, reason: string, isAdmin = false) {
  const order = await getOrderById(orderId, actorId, isAdmin);
  if (!CANCELABLE.includes(order.status as (typeof CANCELABLE)[number])) {
    throw new AppError("INVALID_STATUS", "This order can no longer be cancelled", 400);
  }
  await transitionOrder(orderId, "CANCELLED", actorId, reason, isAdmin);
  return getOrderById(orderId, actorId, isAdmin);
}

export async function transitionOrder(orderId: number, toStatus: string, actorId: number, note?: string, isAdmin = false) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  const allowed = TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new AppError("INVALID_STATUS", `Cannot change ${order.status} to ${toStatus}`, 400);
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE orders SET status = ? WHERE id = ?", [toStatus, orderId]);
    if (toStatus === "CANCELLED") {
      await conn.query("UPDATE orders SET cancelled_at = NOW(), cancel_reason = ? WHERE id = ?", [note ?? "Cancelled", orderId]);
      const [items] = await conn.query("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
      for (const item of items as Array<{ variant_id: number; quantity: number }>) {
        await conn.query("UPDATE inventory SET reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE variant_id = ?", [
          item.quantity,
          item.variant_id,
        ]);
        await conn.query(
          `INSERT INTO inventory_transactions (variant_id, previous_stock, new_stock, difference, reason, notes)
           SELECT variant_id, stock, stock, 0, 'RELEASE', ? FROM inventory WHERE variant_id = ?`,
          [`Released from cancelled ${order.orderNumber}`, item.variant_id],
        );
      }
    }
    if (toStatus === "CONFIRMED" || toStatus === "PROCESSING") {
      // convert reservation to sale when packing/shipping starts (on CONFIRMED)
    }
    if (toStatus === "PACKED") {
      const [items] = await conn.query("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [orderId]);
      for (const item of items as Array<{ variant_id: number; quantity: number }>) {
        const [invRows] = await conn.query("SELECT stock, reserved_stock FROM inventory WHERE variant_id = ? FOR UPDATE", [item.variant_id]);
        const inv = (invRows as Array<{ stock: number; reserved_stock: number }>)[0];
        if (!inv) continue;
        const newStock = inv.stock - item.quantity;
        if (newStock < 0) throw new AppError("NEGATIVE_STOCK", "Cannot pack, stock would go negative", 400);
        await conn.query("UPDATE inventory SET stock = ?, reserved_stock = GREATEST(reserved_stock - ?, 0) WHERE variant_id = ?", [
          newStock,
          item.quantity,
          item.variant_id,
        ]);
        await conn.query(
          `INSERT INTO inventory_transactions (variant_id, previous_stock, new_stock, difference, reason, notes)
           VALUES (?, ?, ?, ?, 'SALE', ?)`,
          [item.variant_id, inv.stock, newStock, -item.quantity, `Packed ${order.orderNumber}`],
        );
      }
    }
    if (toStatus === "DELIVERED" && order.paymentStatus === "PENDING") {
      await conn.query("UPDATE orders SET payment_status = 'SUCCESS' WHERE id = ?", [orderId]);
      await conn.query("UPDATE payments SET status = 'SUCCESS' WHERE order_id = ? AND method = 'COD'", [orderId]);
    }
    await conn.query(
      "INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)",
      [orderId, order.status, toStatus, actorId, note ?? null],
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  if (isAdmin) {
    await audit({ adminUserId: actorId, action: "ORDER_STATUS_CHANGED", resource: "order", resourceId: orderId, metadata: { toStatus } });
  }
}

export async function adminListOrders(filters: { q?: string; status?: string; page?: number; limit?: number }) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  if (filters.status) {
    where.push("o.status = ?");
    params.push(filters.status);
  }
  if (filters.q) {
    where.push("(o.order_number LIKE ? OR u.email LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?)");
    const like = `%${filters.q}%`;
    params.push(like, like, like);
  }
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o INNER JOIN users u ON u.id = o.user_id WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await pool.query(
    `SELECT o.id, o.order_number AS orderNumber, o.status, o.payment_status AS paymentStatus,
            o.total, o.created_at AS createdAt,
            u.first_name AS firstName, u.last_name AS lastName, u.email
     FROM orders o INNER JOIN users u ON u.id = o.user_id
     WHERE ${where.join(" AND ")}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  return { items: rows, total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0), page, limit };
}
