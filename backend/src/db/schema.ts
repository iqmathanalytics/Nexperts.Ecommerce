import {
  mysqlTable,
  bigint,
  varchar,
  text,
  decimal,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const id = () => bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();
const money = (name: string) => decimal(name, { precision: 12, scale: 2 }).notNull();
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
};

export const users = mysqlTable(
  "users",
  {
    id: id(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    status: mysqlEnum("status", ["ACTIVE", "SUSPENDED", "DELETED"]).notNull().default("ACTIVE"),
    emailVerifiedAt: timestamp("email_verified_at"),
    lastLoginAt: timestamp("last_login_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    index("users_status_idx").on(t.status),
    index("users_created_idx").on(t.createdAt),
  ],
);

export const roles = mysqlTable(
  "roles",
  {
    id: id(),
    name: varchar("name", { length: 50 }).notNull(),
    description: varchar("description", { length: 255 }),
    ...timestamps,
  },
  (t) => [uniqueIndex("roles_name_unique").on(t.name)],
);

export const permissions = mysqlTable(
  "permissions",
  {
    id: id(),
    code: varchar("code", { length: 80 }).notNull(),
    description: varchar("description", { length: 255 }),
    ...timestamps,
  },
  (t) => [uniqueIndex("permissions_code_unique").on(t.code)],
);

export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    id: id(),
    roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
    permissionId: bigint("permission_id", { mode: "number", unsigned: true }).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("role_permission_unique").on(t.roleId, t.permissionId),
    index("role_permissions_role_idx").on(t.roleId),
  ],
);

export const userRoles = mysqlTable(
  "user_roles",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    roleId: bigint("role_id", { mode: "number", unsigned: true }).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("user_role_unique").on(t.userId, t.roleId),
    index("user_roles_user_idx").on(t.userId),
    index("user_roles_role_idx").on(t.roleId),
  ],
);

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("password_reset_user_idx").on(t.userId),
    index("password_reset_token_idx").on(t.tokenHash),
  ],
);

export const categories = mysqlTable(
  "categories",
  {
    id: id(),
    parentId: bigint("parent_id", { mode: "number", unsigned: true }),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    imageUrl: varchar("image_url", { length: 500 }),
    status: mysqlEnum("status", ["ACTIVE", "ARCHIVED"]).notNull().default("ACTIVE"),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    sortOrder: int("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("categories_slug_unique").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
    index("categories_status_idx").on(t.status),
  ],
);

export const brands = mysqlTable(
  "brands",
  {
    id: id(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    logoUrl: varchar("logo_url", { length: 500 }),
    lookbookBio: text("lookbook_bio"),
    heroImageUrl: varchar("hero_image_url", { length: 500 }),
    status: mysqlEnum("status", ["ACTIVE", "ARCHIVED"]).notNull().default("ACTIVE"),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("brands_slug_unique").on(t.slug),
    uniqueIndex("brands_name_unique").on(t.name),
    index("brands_status_idx").on(t.status),
  ],
);

export const products = mysqlTable(
  "products",
  {
    id: id(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    description: text("description"),
    brandId: bigint("brand_id", { mode: "number", unsigned: true }),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "ARCHIVED"]).notNull().default("DRAFT"),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    specifications: json("specifications").$type<Record<string, string>>(),
    shippingInfo: text("shipping_info"),
    returnInfo: text("return_info"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    gender: mysqlEnum("gender", ["MEN", "WOMEN", "UNISEX"]).notNull().default("UNISEX"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_unique").on(t.slug),
    index("products_brand_idx").on(t.brandId),
    index("products_status_idx").on(t.status),
    index("products_featured_idx").on(t.isFeatured),
    index("products_created_idx").on(t.createdAt),
    index("products_name_idx").on(t.name),
  ],
);

export const productCategories = mysqlTable(
  "product_categories",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("product_category_unique").on(t.productId, t.categoryId),
    index("product_categories_product_idx").on(t.productId),
    index("product_categories_category_idx").on(t.categoryId),
  ],
);

export const productVariants = mysqlTable(
  "product_variants",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    sku: varchar("sku", { length: 80 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    attributes: json("attributes").$type<Record<string, string>>(),
    price: money("price"),
    mrp: money("mrp"),
    weightGrams: int("weight_grams"),
    barcode: varchar("barcode", { length: 64 }),
    isDefault: boolean("is_default").notNull().default(false),
    status: mysqlEnum("status", ["ACTIVE", "ARCHIVED"]).notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("product_variants_sku_unique").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
    index("product_variants_price_idx").on(t.price),
  ],
);

export const productImages = mysqlTable(
  "product_images",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }),
    url: varchar("url", { length: 800 }).notNull(),
    storageKey: varchar("storage_key", { length: 400 }).notNull(),
    alt: varchar("alt", { length: 255 }),
    sortOrder: int("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("product_images_product_idx").on(t.productId),
    index("product_images_variant_idx").on(t.variantId),
  ],
);

export const inventory = mysqlTable(
  "inventory",
  {
    id: id(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }).notNull(),
    stock: int("stock").notNull().default(0),
    reservedStock: int("reserved_stock").notNull().default(0),
    reorderLevel: int("reorder_level").notNull().default(5),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("inventory_variant_unique").on(t.variantId),
    index("inventory_stock_idx").on(t.stock),
  ],
);

export const inventoryTransactions = mysqlTable(
  "inventory_transactions",
  {
    id: id(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }).notNull(),
    previousStock: int("previous_stock").notNull(),
    newStock: int("new_stock").notNull(),
    difference: int("difference").notNull(),
    reason: mysqlEnum("reason", [
      "PURCHASE",
      "MANUAL_ADJUSTMENT",
      "DAMAGE",
      "RETURN",
      "CORRECTION",
      "SALE",
      "RESERVE",
      "RELEASE",
    ]).notNull(),
    adminUserId: bigint("admin_user_id", { mode: "number", unsigned: true }),
    notes: varchar("notes", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("inventory_tx_variant_idx").on(t.variantId),
    index("inventory_tx_created_idx").on(t.createdAt),
  ],
);

export const carts = mysqlTable(
  "carts",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("carts_user_unique").on(t.userId)],
);

export const cartItems = mysqlTable(
  "cart_items",
  {
    id: id(),
    cartId: bigint("cart_id", { mode: "number", unsigned: true }).notNull(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }).notNull(),
    quantity: int("quantity").notNull().default(1),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("cart_item_variant_unique").on(t.cartId, t.variantId),
    index("cart_items_cart_idx").on(t.cartId),
  ],
);

export const wishlists = mysqlTable(
  "wishlists",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("wishlists_user_unique").on(t.userId)],
);

export const wishlistItems = mysqlTable(
  "wishlist_items",
  {
    id: id(),
    wishlistId: bigint("wishlist_id", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("wishlist_item_product_unique").on(t.wishlistId, t.productId),
    index("wishlist_items_wishlist_idx").on(t.wishlistId),
  ],
);

export const addresses = mysqlTable(
  "addresses",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    line1: varchar("line1", { length: 255 }).notNull(),
    line2: varchar("line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    country: varchar("country", { length: 80 }).notNull().default("India"),
    isDefault: boolean("is_default").notNull().default(false),
    label: varchar("label", { length: 40 }).default("Home"),
    ...timestamps,
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

export const coupons = mysqlTable(
  "coupons",
  {
    id: id(),
    code: varchar("code", { length: 40 }).notNull(),
    type: mysqlEnum("type", ["PERCENTAGE", "FIXED"]).notNull(),
    value: money("value"),
    minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
    maxDiscount: decimal("max_discount", { precision: 12, scale: 2 }),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    usageLimit: int("usage_limit"),
    usageCount: int("usage_count").notNull().default(0),
    perUserLimit: int("per_user_limit").notNull().default(1),
    status: mysqlEnum("status", ["ACTIVE", "INACTIVE"]).notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("coupons_code_unique").on(t.code),
    index("coupons_status_idx").on(t.status),
    index("coupons_dates_idx").on(t.startsAt, t.endsAt),
  ],
);

export const couponUsage = mysqlTable(
  "coupon_usage",
  {
    id: id(),
    couponId: bigint("coupon_id", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }),
    discountAmount: money("discount_amount"),
    usedAt: timestamp("used_at").defaultNow().notNull(),
  },
  (t) => [
    index("coupon_usage_coupon_idx").on(t.couponId),
    index("coupon_usage_user_idx").on(t.userId),
  ],
);

export const orders = mysqlTable(
  "orders",
  {
    id: id(),
    orderNumber: varchar("order_number", { length: 32 }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    status: mysqlEnum("status", [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ])
      .notNull()
      .default("PENDING"),
    paymentStatus: mysqlEnum("payment_status", ["PENDING", "SUCCESS", "FAILED", "REFUNDED"])
      .notNull()
      .default("PENDING"),
    subtotal: money("subtotal"),
    discount: money("discount"),
    tax: money("tax"),
    shipping: money("shipping"),
    total: money("total"),
    couponId: bigint("coupon_id", { mode: "number", unsigned: true }),
    couponCode: varchar("coupon_code", { length: 40 }),
    shippingAddress: json("shipping_address").$type<Record<string, string>>().notNull(),
    notes: varchar("notes", { length: 500 }),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: varchar("cancel_reason", { length: 255 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_number_unique").on(t.orderNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_payment_idx").on(t.paymentStatus),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: id(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }).notNull(),
    productName: varchar("product_name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 80 }).notNull(),
    variantName: varchar("variant_name", { length: 150 }).notNull(),
    imageUrl: varchar("image_url", { length: 800 }),
    quantity: int("quantity").notNull(),
    unitPrice: money("unit_price"),
    mrp: money("mrp"),
    discount: money("discount"),
    tax: money("tax"),
    total: money("total"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
  ],
);

export const orderStatusHistory = mysqlTable(
  "order_status_history",
  {
    id: id(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    fromStatus: varchar("from_status", { length: 30 }),
    toStatus: varchar("to_status", { length: 30 }).notNull(),
    changedBy: bigint("changed_by", { mode: "number", unsigned: true }),
    note: varchar("note", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId)],
);

export const payments = mysqlTable(
  "payments",
  {
    id: id(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    provider: varchar("provider", { length: 40 }).notNull(),
    method: varchar("method", { length: 40 }).notNull(),
    status: mysqlEnum("status", ["PENDING", "SUCCESS", "FAILED", "REFUNDED"]).notNull().default("PENDING"),
    amount: money("amount"),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    providerRef: varchar("provider_ref", { length: 120 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    index("payments_order_idx").on(t.orderId),
    index("payments_status_idx").on(t.status),
  ],
);

export const reviews = mysqlTable(
  "reviews",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    rating: int("rating").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    comment: text("comment").notNull(),
    fitFeedback: mysqlEnum("fit_feedback", ["SMALL", "TRUE", "LARGE"]),
    status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED", "HIDDEN"]).notNull().default("PENDING"),
    isVerified: boolean("is_verified").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("reviews_user_product_order_unique").on(t.userId, t.productId, t.orderId),
    index("reviews_product_idx").on(t.productId),
    index("reviews_status_idx").on(t.status),
  ],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    type: varchar("type", { length: 60 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_created_idx").on(t.createdAt),
  ],
);

export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
    sessionId: varchar("session_id", { length: 64 }),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    payload: json("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("analytics_events_type_idx").on(t.eventType),
    index("analytics_events_created_idx").on(t.createdAt),
  ],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: id(),
    adminUserId: bigint("admin_user_id", { mode: "number", unsigned: true }),
    action: varchar("action", { length: 80 }).notNull(),
    resource: varchar("resource", { length: 80 }).notNull(),
    resourceId: varchar("resource_id", { length: 64 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_admin_idx").on(t.adminUserId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

export const settings = mysqlTable("settings", {
  id: id(),
  key: varchar("key", { length: 80 }).notNull(),
  value: json("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => [uniqueIndex("settings_key_unique").on(t.key)]);

export const orderCounters = mysqlTable("order_counters", {
  id: id(),
  year: int("year").notNull(),
  lastNumber: int("last_number").notNull().default(0),
}, (t) => [uniqueIndex("order_counters_year_unique").on(t.year)]);

// Wave 3 — Premium fashion features

export const collections = mysqlTable(
  "collections",
  {
    id: id(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    season: mysqlEnum("season", ["spring", "summer", "festive", "winter", "all"]).notNull().default("all"),
    description: text("description"),
    imageUrl: varchar("image_url", { length: 500 }),
    status: mysqlEnum("status", ["ACTIVE", "ARCHIVED", "DRAFT"]).notNull().default("ACTIVE"),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("collections_slug_unique").on(t.slug),
    index("collections_season_idx").on(t.season),
    index("collections_status_idx").on(t.status),
  ],
);

export const collectionProducts = mysqlTable(
  "collection_products",
  {
    id: id(),
    collectionId: bigint("collection_id", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("collection_product_unique").on(t.collectionId, t.productId),
    index("collection_products_collection_idx").on(t.collectionId),
    index("collection_products_product_idx").on(t.productId),
  ],
);

export const lookbooks = mysqlTable(
  "lookbooks",
  {
    id: id(),
    brandId: bigint("brand_id", { mode: "number", unsigned: true }),
    slug: varchar("slug", { length: 200 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    coverImageUrl: varchar("cover_image_url", { length: 800 }),
    videoUrl: varchar("video_url", { length: 800 }),
    status: mysqlEnum("status", ["ACTIVE", "ARCHIVED", "DRAFT"]).notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("lookbooks_slug_unique").on(t.slug),
    index("lookbooks_brand_idx").on(t.brandId),
    index("lookbooks_status_idx").on(t.status),
  ],
);

export const lookbookItems = mysqlTable(
  "lookbook_items",
  {
    id: id(),
    lookbookId: bigint("lookbook_id", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    hotspotX: decimal("hotspot_x", { precision: 5, scale: 2 }),
    hotspotY: decimal("hotspot_y", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("lookbook_items_lookbook_idx").on(t.lookbookId),
    index("lookbook_items_product_idx").on(t.productId),
  ],
);

export const stylePreferences = mysqlTable(
  "style_preferences",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    preferredSize: varchar("preferred_size", { length: 20 }),
    lengthDeltaCm: int("length_delta_cm").notNull().default(0),
    fitPreference: mysqlEnum("fit_preference", ["slim", "regular", "oversized"]).notNull().default("regular"),
    quizAnswers: json("quiz_answers").$type<Record<string, unknown>>(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("style_preferences_user_unique").on(t.userId)],
);

export const savedOutfits = mysqlTable(
  "saved_outfits",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    shareSlug: varchar("share_slug", { length: 80 }).notNull(),
    coverImageUrl: varchar("cover_image_url", { length: 800 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("saved_outfits_share_slug_unique").on(t.shareSlug),
    index("saved_outfits_user_idx").on(t.userId),
  ],
);

export const savedOutfitItems = mysqlTable(
  "saved_outfit_items",
  {
    id: id(),
    outfitId: bigint("outfit_id", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("saved_outfit_items_outfit_idx").on(t.outfitId),
    index("saved_outfit_items_product_idx").on(t.productId),
  ],
);

export const loyaltyAccounts = mysqlTable(
  "loyalty_accounts",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    balance: int("balance").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("loyalty_accounts_user_unique").on(t.userId)],
);

export const loyaltyTransactions = mysqlTable(
  "loyalty_transactions",
  {
    id: id(),
    accountId: bigint("account_id", { mode: "number", unsigned: true }).notNull(),
    points: int("points").notNull(),
    type: mysqlEnum("type", ["EARN", "REDEEM", "ADJUST"]).notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("loyalty_tx_account_idx").on(t.accountId),
    index("loyalty_tx_created_idx").on(t.createdAt),
  ],
);

export const productFitStats = mysqlTable(
  "product_fit_stats",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    smallCount: int("small_count").notNull().default(0),
    trueCount: int("true_count").notNull().default(0),
    largeCount: int("large_count").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("product_fit_stats_product_unique").on(t.productId)],
);

export const waitlistEntries = mysqlTable(
  "waitlist_entries",
  {
    id: id(),
    variantId: bigint("variant_id", { mode: "number", unsigned: true }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    notifiedAt: timestamp("notified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("waitlist_variant_email_unique").on(t.variantId, t.email),
    index("waitlist_variant_idx").on(t.variantId),
  ],
);

export const productPresence = mysqlTable(
  "product_presence",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    viewers: int("viewers").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("product_presence_product_unique").on(t.productId)],
);

export const ugcPhotos = mysqlTable(
  "ugc_photos",
  {
    id: id(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    imageUrl: varchar("image_url", { length: 800 }).notNull(),
    caption: varchar("caption", { length: 500 }),
    status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).notNull().default("PENDING"),
    ...timestamps,
  },
  (t) => [
    index("ugc_photos_product_idx").on(t.productId),
    index("ugc_photos_status_idx").on(t.status),
  ],
);

export const referrals = mysqlTable(
  "referrals",
  {
    id: id(),
    referrerUserId: bigint("referrer_user_id", { mode: "number", unsigned: true }).notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    rewardAmount: decimal("reward_amount", { precision: 12, scale: 2 }).notNull().default("100.00"),
    referredUserId: bigint("referred_user_id", { mode: "number", unsigned: true }),
    status: mysqlEnum("status", ["ACTIVE", "CLAIMED", "EXPIRED"]).notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("referrals_code_unique").on(t.code),
    index("referrals_referrer_idx").on(t.referrerUserId),
  ],
);

export const orderTrackingEvents = mysqlTable(
  "order_tracking_events",
  {
    id: id(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    message: varchar("message", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("order_tracking_order_idx").on(t.orderId),
    index("order_tracking_created_idx").on(t.createdAt),
  ],
);

export const consentRecords = mysqlTable(
  "consent_records",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    type: varchar("type", { length: 60 }).notNull(),
    granted: boolean("granted").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("consent_records_user_idx").on(t.userId),
    index("consent_records_type_idx").on(t.type),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  variants: many(productVariants),
  images: many(productImages),
  categories: many(productCategories),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  inventory: one(inventory, { fields: [productVariants.id], references: [inventory.variantId] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));
