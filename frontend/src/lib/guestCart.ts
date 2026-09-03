"use client";

/** Guest bag stored until login merge */
const KEY = "nx_guest_cart";
export const GUEST_CART_EVENT = "nx-guest-cart";

export type GuestCartItem = {
  variantId: number;
  quantity: number;
  productName?: string;
  price?: number;
  imageUrl?: string | null;
  slug?: string;
  size?: string;
};

function emitGuestCart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GUEST_CART_EVENT));
  }
}

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  emitGuestCart();
}

export function addGuestCartItem(item: GuestCartItem) {
  const items = readGuestCart();
  const existing = items.find((i) => i.variantId === item.variantId);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  writeGuestCart(items);
  return items;
}

export function setGuestCartQuantity(variantId: number, quantity: number) {
  const items = readGuestCart()
    .map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  writeGuestCart(items);
  return items;
}

export function removeGuestCartItem(variantId: number) {
  writeGuestCart(readGuestCart().filter((i) => i.variantId !== variantId));
}

export function clearGuestCart() {
  localStorage.removeItem(KEY);
  emitGuestCart();
}

export function guestCartCount() {
  return readGuestCart().reduce((n, i) => n + i.quantity, 0);
}
