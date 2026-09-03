"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { GUEST_CART_EVENT, readGuestCart, type GuestCartItem } from "@/lib/guestCart";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { Drawer } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/state";

type CartPayload = {
  items: Array<{
    id: number;
    quantity: number;
    productName: string;
    slug: string;
    imageUrl: string | null;
    price: number;
    size?: string;
  }>;
  subtotal?: number;
};

type DisplayItem = {
  key: string | number;
  quantity: number;
  productName: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  size?: string;
};

function guestToDisplay(items: GuestCartItem[]): DisplayItem[] {
  return items.map((i) => ({
    key: i.variantId,
    quantity: i.quantity,
    productName: i.productName ?? "Item",
    slug: i.slug ?? "products",
    imageUrl: i.imageUrl ?? null,
    price: i.price ?? 0,
    size: i.size,
  }));
}

export function MiniCart() {
  const { miniCartOpen, closeMiniCart } = useStoreUi();
  const { isAuthenticated } = useSession();
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    const sync = () => setGuestItems(readGuestCart());
    sync();
    window.addEventListener(GUEST_CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(GUEST_CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<CartPayload>("/cart"),
    enabled: isAuthenticated && miniCartOpen,
    retry: false,
  });

  const items: DisplayItem[] = isAuthenticated
    ? (cart.data?.data.items ?? []).map((item) => ({
        key: item.id,
        quantity: item.quantity,
        productName: item.productName,
        slug: item.slug,
        imageUrl: item.imageUrl,
        price: item.price,
        size: item.size,
      }))
    : guestToDisplay(guestItems);

  const subtotal = isAuthenticated
    ? (cart.data?.data.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0))
    : items.reduce((s, i) => s + i.price * i.quantity, 0);

  const loading = isAuthenticated && cart.isLoading;

  return (
    <Drawer open={miniCartOpen} onClose={closeMiniCart} title="Your bag">
      <div className="flex h-full flex-col">
        {loading ? (
          <div className="space-y-4 p-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-display text-2xl font-semibold">Your bag is empty</p>
            <Link href="/products" onClick={closeMiniCart} className="text-sm font-semibold underline-offset-4 hover:underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3">
                  <Link href={`/products/${item.slug}`} onClick={closeMiniCart} className="relative h-24 w-16 shrink-0 overflow-hidden bg-surface-muted">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill className="object-cover object-center" sizes="72px" />
                    ) : (
                      <div className="h-full w-full bg-line" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}`} onClick={closeMiniCart} className="line-clamp-2 text-sm font-medium">
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      Qty {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{formatINR(item.price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              {!isAuthenticated ? (
                <div className="grid gap-2">
                  <p className="text-xs text-muted">Sign in to checkout — your bag will merge automatically.</p>
                  <Link
                    href={loginUrl("/checkout")}
                    onClick={closeMiniCart}
                    className="btn-store btn-fill inline-flex h-11 items-center justify-center text-sm font-semibold"
                  >
                    Sign in to checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={closeMiniCart}
                    className="btn-store inline-flex h-11 items-center justify-center border border-line bg-white text-sm font-semibold text-[#1c1915] hover:border-[#1c1915]"
                  >
                    View bag
                  </Link>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Link
                    href="/checkout"
                    onClick={closeMiniCart}
                    className="btn-store btn-fill inline-flex h-11 items-center justify-center text-sm font-semibold"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={closeMiniCart}
                    className="btn-store inline-flex h-11 items-center justify-center border border-line bg-white text-sm font-semibold text-[#1c1915] hover:border-[#1c1915]"
                  >
                    View bag
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
