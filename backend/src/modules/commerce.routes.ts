import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/http";
import { requireAdmin, requireCustomer, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as address from "./customers/address.service";
import * as coupon from "./coupons/coupon.service";
import * as order from "./orders/order.service";
import * as inventory from "./inventory/inventory.service";
import * as review from "./reviews/review.service";
import * as analytics from "./analytics/analytics.service";
import * as adminUsers from "./admin/adminUsers.service";

export const addressRouter = Router();
addressRouter.use(requireCustomer);
addressRouter.get("/", asyncHandler(async (req, res) => res.json(success(await address.listAddresses(req.user!.id)))));
addressRouter.post("/", validate(address.addressSchema), asyncHandler(async (req, res) => res.status(201).json(success(await address.createAddress(req.user!.id, req.body)))));
addressRouter.put("/:id", validate(address.addressSchema), asyncHandler(async (req, res) => res.json(success(await address.updateAddress(req.user!.id, Number(req.params.id), req.body)))));
addressRouter.delete("/:id", asyncHandler(async (req, res) => { await address.deleteAddress(req.user!.id, Number(req.params.id)); res.json(success({ ok: true })); }));
addressRouter.post("/:id/default", asyncHandler(async (req, res) => { await address.setDefaultAddress(req.user!.id, Number(req.params.id)); res.json(success({ ok: true })); }));

export const checkoutRouter = Router();
checkoutRouter.use(requireCustomer);
checkoutRouter.post("/quote", asyncHandler(async (req, res) => {
  const couponCode = typeof req.body?.couponCode === "string" ? req.body.couponCode : undefined;
  res.json(success(await order.quoteCheckout(req.user!.id, couponCode)));
}));
checkoutRouter.post("/", validate(order.checkoutSchema), asyncHandler(async (req, res) => {
  res.status(201).json(success(await order.placeOrder(req.user!.id, req.body)));
}));

export const orderRouter = Router();
orderRouter.use(requireCustomer);
orderRouter.get("/", asyncHandler(async (req, res) => res.json(success(await order.listCustomerOrders(req.user!.id)))));
orderRouter.get("/:id", asyncHandler(async (req, res) => res.json(success(await order.getOrderById(Number(req.params.id), req.user!.id)))));
orderRouter.post("/:id/cancel", asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason ?? "Cancelled by customer");
  res.json(success(await order.cancelOrder(Number(req.params.id), req.user!.id, reason)));
}));

export const reviewRouter = Router();
reviewRouter.use(requireCustomer);
reviewRouter.get("/eligible", asyncHandler(async (req, res) => {
  const productId = req.query.productId ? Number(req.query.productId) : undefined;
  res.json(success(await review.listEligibleReviews(req.user!.id, productId)));
}));
reviewRouter.get("/", asyncHandler(async (req, res) => res.json(success(await review.listMyReviews(req.user!.id)))));
reviewRouter.post("/", validate(review.reviewSchema), asyncHandler(async (req, res) => res.status(201).json(success(await review.createReview(req.user!.id, req.body)))));

export const couponPublicRouter = Router();
couponPublicRouter.use(requireCustomer);
couponPublicRouter.post("/preview", asyncHandler(async (req, res) => {
  const quote = await order.quoteCheckout(req.user!.id, String(req.body.code ?? ""));
  res.json(success(quote.coupon));
}));

export const adminOpsRouter = Router();
adminOpsRouter.use(requireAdmin);

adminOpsRouter.get("/orders", requirePermission("order.read"), asyncHandler(async (req, res) => {
  res.json(success(await order.adminListOrders({
    q: String(req.query.q ?? ""),
    status: String(req.query.status ?? ""),
    paymentStatus: String(req.query.paymentStatus ?? ""),
    from: String(req.query.from ?? ""),
    to: String(req.query.to ?? ""),
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 50),
  })));
}));
adminOpsRouter.post("/orders/bulk-status", requirePermission("order.update"), validate(order.bulkStatusSchema), asyncHandler(async (req, res) => {
  res.json(success(await order.bulkTransitionOrders(req.body.ids, req.body.status, req.user!.id, req.body.note)));
}));
adminOpsRouter.get("/orders/:id", requirePermission("order.read"), asyncHandler(async (req, res) => {
  res.json(success(await order.getOrderById(Number(req.params.id), undefined, true)));
}));
adminOpsRouter.post("/orders/:id/status", requirePermission("order.update"), asyncHandler(async (req, res) => {
  await order.transitionOrder(Number(req.params.id), String(req.body.status), req.user!.id, req.body.note, true);
  res.json(success({ ok: true }));
}));
adminOpsRouter.post("/orders/:id/cancel", requirePermission("order.cancel"), asyncHandler(async (req, res) => {
  res.json(success(await order.cancelOrder(Number(req.params.id), req.user!.id, String(req.body?.reason ?? "Cancelled by admin"), true)));
}));

adminOpsRouter.get("/inventory", requirePermission("inventory.read"), asyncHandler(async (req, res) => {
  const filter = req.query.filter === "low" || req.query.filter === "out" ? req.query.filter : "all";
  res.json(success(await inventory.listInventory(filter, String(req.query.q ?? ""))));
}));
adminOpsRouter.post("/inventory/adjust", requirePermission("inventory.update"), validate(inventory.adjustSchema), asyncHandler(async (req, res) => {
  res.json(success(await inventory.adjustStock(req.user!.id, req.body, req.ip)));
}));
adminOpsRouter.get("/inventory/transactions", requirePermission("inventory.read"), asyncHandler(async (req, res) => {
  const reason = String(req.query.reason ?? "");
  res.json(
    success(
      await inventory.listTransactions({
        variantId: req.query.variantId ? Number(req.query.variantId) : undefined,
        q: String(req.query.q ?? "") || undefined,
        reason: reason || undefined,
        from: String(req.query.from ?? "") || undefined,
        to: String(req.query.to ?? "") || undefined,
      }),
    ),
  );
}));
adminOpsRouter.get("/inventory/analytics", requirePermission("analytics.read"), asyncHandler(async (_req, res) => {
  res.json(success(await inventory.inventoryAnalytics()));
}));

adminOpsRouter.get("/coupons", requirePermission("coupon.manage"), asyncHandler(async (_req, res) => res.json(success(await coupon.listCoupons()))));
adminOpsRouter.post("/coupons", requirePermission("coupon.manage"), validate(coupon.couponSchema), asyncHandler(async (req, res) => res.status(201).json(success(await coupon.createCoupon(req.user!.id, req.body)))));
adminOpsRouter.put("/coupons/:id", requirePermission("coupon.manage"), validate(coupon.couponSchema), asyncHandler(async (req, res) => { await coupon.updateCoupon(req.user!.id, Number(req.params.id), req.body); res.json(success({ ok: true })); }));

adminOpsRouter.get("/reviews", requirePermission("review.manage"), asyncHandler(async (req, res) => res.json(success(await review.adminListReviews(String(req.query.status ?? ""))))));
adminOpsRouter.post("/reviews/:id/moderate", requirePermission("review.manage"), validate(review.moderateSchema), asyncHandler(async (req, res) => {
  res.json(success(await review.moderateReview(req.user!.id, Number(req.params.id), req.body.status)));
}));
adminOpsRouter.delete("/reviews/:id", requirePermission("review.manage"), asyncHandler(async (req, res) => {
  await review.deleteReview(req.user!.id, Number(req.params.id));
  res.json(success({ ok: true }));
}));

adminOpsRouter.get("/analytics/dashboard", requirePermission("analytics.read"), asyncHandler(async (req, res) => {
  res.json(success(await analytics.dashboard(String(req.query.period ?? "30d"))));
}));
adminOpsRouter.get("/analytics/sales", requirePermission("analytics.read"), asyncHandler(async (req, res) => {
  res.json(success(await analytics.salesAnalytics(String(req.query.period ?? "30d"))));
}));

adminOpsRouter.get("/customers", requirePermission("customer.read"), asyncHandler(async (req, res) => {
  res.json(
    success(
      await adminUsers.listCustomers(
        String(req.query.q ?? ""),
        Number(req.query.page ?? 1),
        Number(req.query.limit ?? 50),
        String(req.query.status ?? "") || undefined,
      ),
    ),
  );
}));
adminOpsRouter.get("/customers/:id", requirePermission("customer.read"), asyncHandler(async (req, res) => {
  res.json(success(await adminUsers.getCustomer(Number(req.params.id))));
}));
adminOpsRouter.post("/customers/:id/status", requirePermission("customer.update"), validate(adminUsers.customerStatusSchema), asyncHandler(async (req, res) => {
  await adminUsers.updateCustomerStatus(req.user!.id, Number(req.params.id), req.body.status);
  res.json(success({ ok: true }));
}));
adminOpsRouter.delete("/customers/:id", requirePermission("customer.update"), asyncHandler(async (req, res) => {
  await adminUsers.deleteCustomer(req.user!.id, Number(req.params.id));
  res.json(success({ ok: true }));
}));
adminOpsRouter.post("/customers/:id/restore", requirePermission("customer.update"), asyncHandler(async (req, res) => {
  await adminUsers.restoreCustomer(req.user!.id, Number(req.params.id));
  res.json(success({ ok: true }));
}));

adminOpsRouter.get("/users", requirePermission("user.manage"), asyncHandler(async (_req, res) => res.json(success(await adminUsers.listAdminUsers()))));
adminOpsRouter.post("/users", requirePermission("user.manage"), validate(adminUsers.adminUserSchema), asyncHandler(async (req, res) => res.status(201).json(success(await adminUsers.createAdminUser(req.user!.id, req.body)))));
adminOpsRouter.put("/users/:id", requirePermission("user.manage"), validate(adminUsers.adminUserSchema), asyncHandler(async (req, res) => { await adminUsers.updateAdminUser(req.user!.id, Number(req.params.id), req.body); res.json(success({ ok: true })); }));
adminOpsRouter.get("/audit-logs", requirePermission("user.manage"), asyncHandler(async (req, res) => res.json(success(await adminUsers.listAuditLogs(Number(req.query.page ?? 1))))));
