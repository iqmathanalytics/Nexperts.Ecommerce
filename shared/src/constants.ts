export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DELETED"] as const;

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"] as const;

export const COUPON_TYPES = ["PERCENTAGE", "FIXED"] as const;

export const INVENTORY_REASONS = [
  "PURCHASE",
  "MANUAL_ADJUSTMENT",
  "DAMAGE",
  "RETURN",
  "CORRECTION",
  "SALE",
  "RESERVE",
  "RELEASE",
] as const;

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "INVENTORY_MANAGER",
  "ORDER_MANAGER",
  "ANALYST",
  "CUSTOMER",
] as const;

export const PERMISSIONS = [
  "product.create",
  "product.read",
  "product.update",
  "product.delete",
  "inventory.read",
  "inventory.update",
  "order.read",
  "order.update",
  "order.cancel",
  "customer.read",
  "customer.update",
  "analytics.read",
  "user.manage",
  "coupon.manage",
  "review.manage",
  "category.manage",
  "brand.manage",
  "settings.manage",
] as const;

export const SORT_OPTIONS = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
  "popularity",
  "discount",
] as const;

export const CUSTOMER_CANCELABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING"] as const;

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
