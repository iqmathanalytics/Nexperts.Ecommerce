import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { CATALOG, CATEGORY_TREE, CLOTHING_BRANDS, SIZES } from "./catalogData";
import {
  addresses,
  brands,
  categories,
  coupons,
  inventory,
  inventoryTransactions,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  permissions,
  productCategories,
  productImages,
  productVariants,
  products,
  reviews,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema";

const PERMS = [
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
];

const ROLE_PERMS: Record<string, string[]> = {
  SUPER_ADMIN: PERMS,
  ADMIN: PERMS.filter((p) => p !== "user.manage"),
  INVENTORY_MANAGER: ["product.read", "inventory.read", "inventory.update"],
  ORDER_MANAGER: ["order.read", "order.update", "order.cancel", "customer.read"],
  ANALYST: ["analytics.read", "product.read", "inventory.read", "order.read"],
  CUSTOMER: [],
};


function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function insertId<T extends { insertId: number }>(result: [T, unknown]) {
  return Number(result[0].insertId);
}

async function seed() {
  const [existing] = await db.select().from(users).where(eq(users.email, "admin@nexperts.com")).limit(1);
  if (existing) {
    console.log("Seed skipped — admin already exists");
    await pool.end();
    return;
  }

  const permIds = new Map<string, number>();
  for (const code of PERMS) {
    const id = await insertId(await db.insert(permissions).values({ code, description: code }));
    permIds.set(code, id);
  }
  const roleIds = new Map<string, number>();
  for (const name of Object.keys(ROLE_PERMS)) {
    const id = await insertId(await db.insert(roles).values({ name, description: name }));
    roleIds.set(name, id);
    for (const code of ROLE_PERMS[name] ?? []) {
      const permissionId = permIds.get(code);
      if (permissionId) await db.insert(rolePermissions).values({ roleId: id, permissionId });
    }
  }

  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const customerHash = await bcrypt.hash("Customer@12345", 12);

  const adminId = await insertId(await db.insert(users).values({ email: "admin@nexperts.com", passwordHash: adminHash, firstName: "Asha", lastName: "Mehta", phone: "9876500001" }));
  await db.insert(userRoles).values({ userId: adminId, roleId: roleIds.get("SUPER_ADMIN")! });

  const invMgr = await insertId(await db.insert(users).values({ email: "inventory@nexperts.com", passwordHash: adminHash, firstName: "Rahul", lastName: "Iyer", phone: "9876500002" }));
  await db.insert(userRoles).values({ userId: invMgr, roleId: roleIds.get("INVENTORY_MANAGER")! });

  const orderMgr = await insertId(await db.insert(users).values({ email: "orders@nexperts.com", passwordHash: adminHash, firstName: "Neha", lastName: "Kapoor", phone: "9876500003" }));
  await db.insert(userRoles).values({ userId: orderMgr, roleId: roleIds.get("ORDER_MANAGER")! });

  const customerId = await insertId(await db.insert(users).values({ email: "customer@nexperts.com", passwordHash: customerHash, firstName: "Arjun", lastName: "Shah", phone: "9876511111" }));
  await db.insert(userRoles).values({ userId: customerId, roleId: roleIds.get("CUSTOMER")! });

  const extraCustomers = [
    ["priya.nair@example.com", "Priya", "Nair"],
    ["dev.patel@example.com", "Dev", "Patel"],
    ["meera.joshi@example.com", "Meera", "Joshi"],
  ] as const;
  const extraIds: number[] = [];
  for (const [email, first, last] of extraCustomers) {
    const id = await insertId(await db.insert(users).values({ email, passwordHash: customerHash, firstName: first, lastName: last, phone: "9876500100" }));
    await db.insert(userRoles).values({ userId: id, roleId: roleIds.get("CUSTOMER")! });
    extraIds.push(id);
  }

  await db.insert(addresses).values({
    userId: customerId,
    fullName: "Arjun Shah",
    phone: "9876511111",
    line1: "14, Palm Grove Apartments",
    line2: "Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400050",
    isDefault: true,
    label: "Home",
  });

  const catIds = new Map<string, number>();
  let sort = 0;
  for (const parent of CATEGORY_TREE) {
    const pid = await insertId(await db.insert(categories).values({
      name: parent.name,
      slug: slugify(parent.name),
      description: `${parent.name} for the Nexperts clothing collection.`,
      seoTitle: `${parent.name} | Nexperts`,
      seoDescription: `Shop ${parent.name.toLowerCase()} online at Nexperts.`,
      sortOrder: sort++,
    }));
    catIds.set(parent.name, pid);
    for (const child of parent.children) {
      const cid = await insertId(await db.insert(categories).values({
        name: child,
        slug: slugify(child),
        parentId: pid,
        description: child,
        seoTitle: `${child} | Nexperts`,
        seoDescription: `Shop ${child.toLowerCase()} at Nexperts.`,
        sortOrder: sort++,
      }));
      catIds.set(child, cid);
    }
  }

  const brandIds = new Map<string, number>();
  for (const name of CLOTHING_BRANDS) {
    const id = await insertId(await db.insert(brands).values({
      name,
      slug: slugify(name),
      description: `${name} official store on Nexperts.`,
      logoUrl: `https://picsum.photos/seed/brand-${slugify(name)}/200/200`,
      seoTitle: name,
      seoDescription: `Shop ${name} products.`,
    }));
    brandIds.set(name, id);
  }

  const createdProducts: Array<{ id: number; variantId: number; name: string; sku: string; price: number; mrp: number }> = [];
  for (const item of CATALOG) {
    const slug = slugify(item.name);
    const pid = await insertId(await db.insert(products).values({
      name: item.name,
      slug,
      description: item.description,
      brandId: brandIds.get(item.brand) ?? null,
      status: "PUBLISHED",
      gender: item.gender,
      seoTitle: `${item.name} | ${item.brand} | Nexperts`,
      seoDescription: `${item.description.slice(0, 140)}…`,
      specifications: {
        Brand: item.brand,
        Gender: item.gender,
        Category: item.category,
        Fabric: item.fabric,
        Fit: item.fit,
        Care: "Gentle wash · Dry clean recommended for evening wear",
      },
      shippingInfo: "Ships within 24–48 hours. Free shipping on orders above ₹999. Premium packaging on every order.",
      returnInfo: "7-day easy returns on unused items with tags attached.",
      isFeatured: true,
      isNew: true,
    }));
    const linkedCats = [catIds.get(item.category), item.extraCategory ? catIds.get(item.extraCategory) : undefined].filter(
      (id): id is number => Boolean(id),
    );
    if (linkedCats.length) {
      await db.insert(productCategories).values(linkedCats.map((categoryId) => ({ productId: pid, categoryId })));
    }
    await db.insert(productImages).values([
      { productId: pid, url: item.image, storageKey: `catalog/${item.sku}-1.jpg`, alt: item.name, sortOrder: 0, isPrimary: true },
      { productId: pid, url: item.image2, storageKey: `catalog/${item.sku}-2.jpg`, alt: `${item.name} alternate`, sortOrder: 1, isPrimary: false },
    ]);
    let defaultVid = 0;
    for (const [index, size] of SIZES.entries()) {
      const vid = await insertId(await db.insert(productVariants).values({
        productId: pid,
        sku: `${item.sku}-${size}`,
        name: size,
        attributes: { size, gender: item.gender },
        price: String(item.price),
        mrp: String(item.mrp),
        isDefault: index === 0,
      }));
      await db.insert(inventory).values({ variantId: vid, stock: 12 + index * 4, reservedStock: 0, reorderLevel: 4 });
      await db.insert(inventoryTransactions).values({
        variantId: vid,
        previousStock: 0,
        newStock: 12 + index * 4,
        difference: 12 + index * 4,
        reason: "PURCHASE",
        adminUserId: adminId,
        notes: "Initial stock",
      });
      if (index === 0) defaultVid = vid;
    }
    createdProducts.push({ id: pid, variantId: defaultVid, name: item.name, sku: `${item.sku}-S`, price: item.price, mrp: item.mrp });
  }

  const starts = new Date();
  starts.setMonth(starts.getMonth() - 1);
  const ends = new Date();
  ends.setMonth(ends.getMonth() + 6);
  await db.insert(coupons).values([
    { code: "WELCOME10", type: "PERCENTAGE", value: "10.00", minOrderAmount: "999.00", maxDiscount: "500.00", startsAt: starts, endsAt: ends, usageLimit: 1000, perUserLimit: 1, status: "ACTIVE" },
    { code: "FLAT200", type: "FIXED", value: "200.00", minOrderAmount: "1499.00", maxDiscount: null, startsAt: starts, endsAt: ends, usageLimit: 500, perUserLimit: 2, status: "ACTIVE" },
    { code: "FESTIVE20", type: "PERCENTAGE", value: "20.00", minOrderAmount: "2999.00", maxDiscount: "1500.00", startsAt: starts, endsAt: ends, usageLimit: 200, perUserLimit: 1, status: "ACTIVE" },
  ]);

  async function createOrder(userId: number, status: "DELIVERED" | "PENDING" | "PROCESSING", product: (typeof createdProducts)[number], daysAgo: number) {
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);
    const qty = 1;
    const subtotal = product.price * qty;
    const discount = 0;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = subtotal >= 999 ? 0 : 49;
    const total = Math.round((subtotal + tax + shipping) * 100) / 100;
    const year = created.getFullYear();
    const num = `${Date.now()}${userId}${product.id}`.slice(-6);
    const orderNumber = `ORD-${year}-${num}`;
    const oid = await insertId(await db.insert(orders).values({
      orderNumber,
      userId,
      status,
      paymentStatus: status === "DELIVERED" ? "SUCCESS" : "PENDING",
      subtotal: String(subtotal),
      discount: String(discount),
      tax: String(tax),
      shipping: String(shipping),
      total: String(total),
      shippingAddress: { fullName: "Customer", phone: "9876511111", line1: "14 Palm Grove", city: "Mumbai", state: "Maharashtra", postalCode: "400050", country: "India" },
      createdAt: created,
    }));
    await db.insert(orderItems).values({
      orderId: oid,
      productId: product.id,
      variantId: product.variantId,
      productName: product.name,
      sku: product.sku,
      variantName: "Default",
      imageUrl: `https://picsum.photos/seed/${slugify(product.name)}/800/800`,
      quantity: qty,
      unitPrice: String(product.price),
      mrp: String(product.mrp),
      discount: "0",
      tax: String(tax),
      total: String(subtotal),
    });
    await db.insert(payments).values({
      orderId: oid,
      provider: "cod",
      method: "COD",
      status: status === "DELIVERED" ? "SUCCESS" : "PENDING",
      amount: String(total),
      providerRef: `COD-${orderNumber}`,
    });
    await db.insert(orderStatusHistory).values({ orderId: oid, fromStatus: null, toStatus: status, changedBy: adminId, note: "Seeded" });
    return oid;
  }

  const delivered1 = await createOrder(customerId, "DELIVERED", createdProducts[0]!, 20);
  await createOrder(customerId, "PENDING", createdProducts[10]!, 1);
  await createOrder(extraIds[0]!, "PROCESSING", createdProducts[5]!, 4);
  await createOrder(extraIds[1]!, "DELIVERED", createdProducts[7]!, 12);
  await createOrder(extraIds[2]!, "DELIVERED", createdProducts[12]!, 8);

  await db.insert(reviews).values([
    { productId: createdProducts[0]!.id, userId: customerId, orderId: delivered1, rating: 5, title: "Excellent daily driver", comment: "Battery lasts a full day and the display is bright outdoors. Delivery was quick.", status: "APPROVED", isVerified: true },
    { productId: createdProducts[2]!.id, userId: extraIds[0]!, orderId: delivered1, rating: 4, title: "Great sound", comment: "Comfortable fit and clear calls. Bass is a little heavy for podcasts but music sounds rich.", status: "APPROVED", isVerified: true },
    { productId: createdProducts[5]!.id, userId: extraIds[1]!, orderId: delivered1, rating: 5, title: "Perfect fit", comment: "The oxford shirt feels premium and washed well. Would buy another colour.", status: "APPROVED", isVerified: true },
    { productId: createdProducts[10]!.id, userId: extraIds[2]!, orderId: delivered1, rating: 4, title: "Solid mat", comment: "Grippy and thick enough for home yoga. No smell after unboxing.", status: "PENDING", isVerified: true },
  ]);

  console.log("Seed complete");
  console.log("Admin: admin@nexperts.com / Admin@12345");
  console.log("Customer: customer@nexperts.com / Customer@12345");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
