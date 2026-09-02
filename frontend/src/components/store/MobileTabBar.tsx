"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { loginUrl } from "@/lib/auth";
import { useSession } from "@/hooks/useSession";
import { useStoreUi } from "@/components/store/StoreUiContext";

export function MobileTabBar() {
  const path = usePathname();
  const { openSearch, openMiniCart } = useStoreUi();
  const { isAuthenticated } = useSession();
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ items: unknown[] }>("/cart"),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 15_000,
  });
  const count = cart.data?.data.items.length ?? 0;

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] ${
      active ? "text-ink" : "text-muted"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex items-stretch">
        <Link href="/" className={item(path === "/")}>
          <Home className="h-5 w-5" />
          Home
        </Link>
        <Link href="/products" className={item(path.startsWith("/products") || path.startsWith("/category") || path.startsWith("/women") || path.startsWith("/men"))}>
          <LayoutGrid className="h-5 w-5" />
          Shop
        </Link>
        <button type="button" onClick={openSearch} className={item(false)}>
          <Search className="h-5 w-5" />
          Search
        </button>
        <Link
          href={isAuthenticated ? "/account/wishlist" : loginUrl("/account/wishlist")}
          className={item(path.includes("wishlist"))}
        >
          <Heart className="h-5 w-5" />
          Saved
        </Link>
        <button type="button" onClick={openMiniCart} className={`${item(false)} relative`}>
          <ShoppingBag className="h-5 w-5" />
          Bag
          {count > 0 ? (
            <span className="absolute right-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] text-white">
              {count}
            </span>
          ) : null}
        </button>
      </div>
    </nav>
  );
}
