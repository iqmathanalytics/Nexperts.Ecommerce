"use client";

/** Guest bag stored until login merge */
const KEY = "nx_guest_cart";

export type GuestCartItem = { variantId: number; quantity: number; productName?: string; price?: number; imageUrl?: string | null; slug?: string };

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
}

export function addGuestCartItem(item: GuestCartItem) {
  const items = readGuestCart();
  const existing = items.find((i) => i.variantId === item.variantId);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  writeGuestCart(items);
  return items;
}

export function clearGuestCart() {
  localStorage.removeItem(KEY);
}
