import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
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

export async function getCart(userId: number) {
  const cart = await getOrCreateCart(userId);
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
  const detailed = [];
  let subtotal = 0;
  const issues: string[] = [];
  for (const item of items) {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1);
    if (!variant) continue;
    const [product] = await db.select().from(products).where(eq(products.id, variant.productId)).limit(1);
    const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, variant.id)).limit(1);
    const [img] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, variant.productId))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
      .limit(1);
    const available = Math.max(0, Number(inv?.stock ?? 0) - Number(inv?.reservedStock ?? 0));
    const price = toMoney(variant.price);
    const mrp = toMoney(variant.mrp);
    if (!product || product.status !== "PUBLISHED" || variant.status !== "ACTIVE") {
      issues.push(`${variant.sku} is no longer available`);
    } else if (available < item.quantity) {
      issues.push(`${product.name} only has ${available} in stock`);
    }
    subtotal += price * item.quantity;
    detailed.push({
      id: item.id,
      variantId: variant.id,
      productId: variant.productId,
      name: product?.name,
      slug: product?.slug,
      variantName: variant.name,
      sku: variant.sku,
      quantity: item.quantity,
      price,
      mrp,
      discountPercent: discountPercent(mrp, price),
      available,
      imageUrl: img?.url ?? null,
    });
  }
  return { id: cart.id, items: detailed, subtotal: toMoney(subtotal), issues };
}

export async function addToCart(userId: number, input: z.infer<typeof cartItemSchema>) {
  const cart = await getOrCreateCart(userId);
  const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, input.variantId)).limit(1);
  if (!variant || variant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Variant not found", 404);
  const [product] = await db.select().from(products).where(eq(products.id, variant.productId)).limit(1);
  if (!product || product.status !== "PUBLISHED") throw new AppError("NOT_FOUND", "Product not available", 404);
  const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, variant.id)).limit(1);
  const available = Math.max(0, Number(inv?.stock ?? 0) - Number(inv?.reservedStock ?? 0));
  const [existing] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, input.variantId)))
    .limit(1);
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
  const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, targetVariant)).limit(1);
  if (!variant || variant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Variant not found", 404);
  const [product] = await db.select().from(products).where(eq(products.id, variant.productId)).limit(1);
  if (!product || product.status !== "PUBLISHED") throw new AppError("NOT_FOUND", "Product not available", 404);
  const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, targetVariant)).limit(1);
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
  const detailed = [];
  for (const item of items) {
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!product || product.status !== "PUBLISHED") continue;
    const [img] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, item.productId))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
      .limit(1);
    const [variant] = item.variantId
      ? await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1)
      : await db.select().from(productVariants).where(and(eq(productVariants.productId, item.productId), eq(productVariants.isDefault, true))).limit(1);
    detailed.push({
      id: item.id,
      productId: item.productId,
      variantId: variant?.id ?? null,
      name: product?.name,
      slug: product?.slug,
      price: toMoney(variant?.price ?? 0),
      mrp: toMoney(variant?.mrp ?? 0),
      imageUrl: img?.url ?? null,
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
