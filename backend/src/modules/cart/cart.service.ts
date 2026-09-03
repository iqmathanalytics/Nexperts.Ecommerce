import { z } from "zod";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { cartItems, carts, inventory, productImages, productVariants, products, wishlistItems, wishlists } from "../../db/schema";
import { AppError } from "../../utils/http";
import { discountPercent, toMoney } from "../../utils/money";

export const cartItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20).default(1),
});

async function getOrCreateCart(userId: number) {
  const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (cart) return cart;
  const result = await db.insert(carts).values({ userId });
  return { id: Number(result[0].insertId), userId };
}

async function getOrCreateWishlist(userId: number) {
  const [wl] = await db.select().from(wishlists).where(eq(wishlists.userId, userId)).limit(1);
  if (wl) return wl;
  const result = await db.insert(wishlists).values({ userId });
  return { id: Number(result[0].insertId), userId };
}

async function primaryImagesByProduct(productIds: number[]) {
  const imageByProduct = new Map<number, string>();
  if (!productIds.length) return imageByProduct;
  const imgs = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
  for (const img of imgs) {
    if (!imageByProduct.has(img.productId)) imageByProduct.set(img.productId, img.url);
  }
  return imageByProduct;
}

export async function getCart(userId: number) {
  const cart = await getOrCreateCart(userId);
  const rows = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      variantId: productVariants.id,
      productId: products.id,
      name: products.name,
      slug: products.slug,
      productStatus: products.status,
      variantName: productVariants.name,
      sku: productVariants.sku,
      variantStatus: productVariants.status,
      price: productVariants.price,
      mrp: productVariants.mrp,
      stock: inventory.stock,
      reservedStock: inventory.reservedStock,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cart.id));

  const imageByProduct = await primaryImagesByProduct([...new Set(rows.map((r) => r.productId))]);
  const detailed = [];
  let subtotal = 0;
  const issues: string[] = [];
  for (const row of rows) {
    const available = Math.max(0, Number(row.stock ?? 0) - Number(row.reservedStock ?? 0));
    const price = toMoney(row.price);
    const mrp = toMoney(row.mrp);
    if (row.productStatus !== "PUBLISHED" || row.variantStatus !== "ACTIVE") {
      issues.push(`${row.sku} is no longer available`);
    } else if (available < row.quantity) {
      issues.push(`${row.name} only has ${available} in stock`);
    }
    subtotal += price * row.quantity;
    detailed.push({
      id: row.id,
      variantId: row.variantId,
      productId: row.productId,
      name: row.name,
      slug: row.slug,
      variantName: row.variantName,
      sku: row.sku,
      quantity: row.quantity,
      price,
      mrp,
      discountPercent: discountPercent(mrp, price),
      available,
      imageUrl: imageByProduct.get(row.productId) ?? null,
    });
  }
  return { id: cart.id, items: detailed, subtotal: toMoney(subtotal), issues };
}

export async function addToCart(userId: number, input: z.infer<typeof cartItemSchema>) {
  const [cart, variants] = await Promise.all([
    getOrCreateCart(userId),
    db.select().from(productVariants).where(eq(productVariants.id, input.variantId)).limit(1),
  ]);
  const variant = variants[0];
  if (!variant || variant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Variant not found", 404);
  const [[product], [inv], [existing]] = await Promise.all([
    db.select().from(products).where(eq(products.id, variant.productId)).limit(1),
    db.select().from(inventory).where(eq(inventory.variantId, variant.id)).limit(1),
    db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, input.variantId)))
      .limit(1),
  ]);
  if (!product || product.status !== "PUBLISHED") throw new AppError("NOT_FOUND", "Product not available", 404);
  const available = Math.max(0, Number(inv?.stock ?? 0) - Number(inv?.reservedStock ?? 0));
  const nextQty = (existing?.quantity ?? 0) + input.quantity;
  if (nextQty > available) throw new AppError("OUT_OF_STOCK", "Not enough stock for this quantity", 400);
  if (existing) {
    await db.update(cartItems).set({ quantity: nextQty }).where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId: cart.id, variantId: input.variantId, quantity: input.quantity });
  }
  return getCart(userId);
}

export async function updateCartItem(userId: number, itemId: number, quantity: number, variantId?: number) {
  const cart = await getOrCreateCart(userId);
  const [item] = await db.select().from(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id))).limit(1);
  if (!item) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    return getCart(userId);
  }
  const targetVariant = variantId ?? item.variantId;
  const [variants, existingInv] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.id, targetVariant)).limit(1),
    db.select().from(inventory).where(eq(inventory.variantId, targetVariant)).limit(1),
  ]);
  const variant = variants[0];
  if (!variant || variant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Variant not found", 404);
  const [product] = await db.select().from(products).where(eq(products.id, variant.productId)).limit(1);
  if (!product || product.status !== "PUBLISHED") throw new AppError("NOT_FOUND", "Product not available", 404);
  const inv = existingInv[0];
  const available = Math.max(0, Number(inv?.stock ?? 0) - Number(inv?.reservedStock ?? 0));
  if (quantity > available) throw new AppError("OUT_OF_STOCK", "Not enough stock", 400);
  await db.update(cartItems).set({ quantity, variantId: targetVariant }).where(eq(cartItems.id, itemId));
  return getCart(userId);
}

export async function removeCartItem(userId: number, itemId: number) {
  const cart = await getOrCreateCart(userId);
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  return getCart(userId);
}

export async function clearCart(userId: number) {
  const cart = await getOrCreateCart(userId);
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  return getCart(userId);
}

export async function moveCartItemToWishlist(userId: number, itemId: number) {
  const cart = await getCart(userId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw new AppError("NOT_FOUND", "Cart item not found", 404);
  await addToWishlist(userId, item.productId!, item.variantId);
  return removeCartItem(userId, itemId);
}

export async function getWishlist(userId: number) {
  const wl = await getOrCreateWishlist(userId);
  const items = await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, wl.id));
  if (!items.length) return { id: wl.id, items: [] };

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items.map((i) => i.variantId).filter((id): id is number => id != null);

  const [productRows, imageByProduct, explicitVariants, defaultVariants] = await Promise.all([
    db
      .select({ id: products.id, name: products.name, slug: products.slug, status: products.status })
      .from(products)
      .where(inArray(products.id, productIds)),
    primaryImagesByProduct(productIds),
    variantIds.length
      ? db
          .select({
            id: productVariants.id,
            productId: productVariants.productId,
            price: productVariants.price,
            mrp: productVariants.mrp,
          })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds))
      : Promise.resolve([]),
    db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        price: productVariants.price,
        mrp: productVariants.mrp,
      })
      .from(productVariants)
      .where(and(inArray(productVariants.productId, productIds), eq(productVariants.isDefault, true))),
  ]);

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const variantById = new Map(explicitVariants.map((v) => [v.id, v]));
  const defaultByProduct = new Map(defaultVariants.map((v) => [v.productId, v]));

  const detailed = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || product.status !== "PUBLISHED") continue;
    const variant = (item.variantId ? variantById.get(item.variantId) : undefined) ?? defaultByProduct.get(item.productId);
    detailed.push({
      id: item.id,
      productId: item.productId,
      variantId: variant?.id ?? null,
      name: product.name,
      slug: product.slug,
      price: toMoney(variant?.price ?? 0),
      mrp: toMoney(variant?.mrp ?? 0),
      imageUrl: imageByProduct.get(item.productId) ?? null,
    });
  }
  return { id: wl.id, items: detailed };
}

export async function addToWishlist(userId: number, productId: number, variantId?: number | null) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product || product.status !== "PUBLISHED") throw new AppError("NOT_FOUND", "Product not available", 404);
  const wl = await getOrCreateWishlist(userId);
  const [existing] = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, wl.id), eq(wishlistItems.productId, productId)))
    .limit(1);
  if (!existing) {
    await db.insert(wishlistItems).values({ wishlistId: wl.id, productId, variantId: variantId ?? null });
  }
  return getWishlist(userId);
}

export async function removeWishlistItem(userId: number, itemId: number) {
  const wl = await getOrCreateWishlist(userId);
  await db.delete(wishlistItems).where(and(eq(wishlistItems.id, itemId), eq(wishlistItems.wishlistId, wl.id)));
  return getWishlist(userId);
}

export async function moveWishlistToCart(userId: number, itemId: number) {
  const wl = await getWishlist(userId);
  const item = wl.items.find((i) => i.id === itemId);
  if (!item?.variantId) throw new AppError("NOT_FOUND", "Wishlist item not found", 404);
  await addToCart(userId, { variantId: item.variantId, quantity: 1 });
  return removeWishlistItem(userId, itemId);
}
