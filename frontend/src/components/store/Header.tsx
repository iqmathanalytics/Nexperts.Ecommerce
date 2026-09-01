"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Heart, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { SITE_NAME } from "@/lib/utils";
import { loginUrl } from "@/lib/auth";
import { useSession } from "@/hooks/useSession";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
type Suggest = {
  products: Array<{ name: string; slug: string; sku?: string; brand?: string | null }>;
  categories: Array<{ name: string; slug: string }>;
  brands: Array<{ name: string; slug: string }>;
};

export function Header() {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQ = useDebouncedValue(q, 220);
  const boxRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useSession();
  const showBack = path !== "/";
  const suggest = useQuery({
    queryKey: ["suggest", debouncedQ],
    queryFn: () => api<Suggest>(`/products/search/suggest?q=${encodeURIComponent(debouncedQ)}`),
    enabled: debouncedQ.length >= 2,
    staleTime: 60_000,
  });
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ items: unknown[] }>("/cart"),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 15_000,
  });
  const wishlist = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<{ items: unknown[] }>("/wishlist"),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 15_000,
  });
  const cartCount = cart.data?.data.items.length ?? 0;
  const wishCount = wishlist.data?.data.items.length ?? 0;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, []);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = q.trim();
    setOpen(false);
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-1 flex shrink-0 items-center gap-1 rounded-md p-2 text-sm text-ink/80 transition hover:bg-background"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        ) : null}
        <Link href="/" className="text-xl font-bold tracking-tight text-ink">
          {SITE_NAME}
        </Link>
        <div ref={boxRef} className="relative ml-auto w-full max-w-md">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              name="q"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search clothing, brands, SKU"
              className="h-10 w-full rounded-md border border-line bg-background pl-9 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink"
              autoComplete="off"
            />
          </form>
          {open && debouncedQ.length >= 2 && (
            <div className="absolute mt-1 max-h-80 w-full overflow-auto rounded-md border border-line bg-surface p-2 shadow-sm">
              {suggest.isFetching && !(suggest.data?.data.products ?? []).length ? (
                <p className="px-2 py-2 text-sm text-muted">Searching…</p>
              ) : null}
              {(suggest.data?.data.products ?? []).map((p) => (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  className="block rounded-md px-2 py-2 text-sm text-ink hover:bg-background"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {[p.brand, p.sku].filter(Boolean).join(" · ")}
                  </span>
                </Link>
              ))}
              {(suggest.data?.data.brands ?? []).map((b) => (
                <Link
                  key={`brand-${b.slug}`}
                  href={`/products?brand=${encodeURIComponent(b.slug)}`}
                  className="block rounded-md px-2 py-2 text-sm hover:bg-background"
                  onClick={() => setOpen(false)}
                >
                  Brand · {b.name}
                </Link>
              ))}
              {(suggest.data?.data.categories ?? []).map((c) => (
                <Link
                  key={`cat-${c.slug}`}
                  href={`/category/${c.slug}`}
                  className="block rounded-md px-2 py-2 text-sm hover:bg-background"
                  onClick={() => setOpen(false)}
                >
                  Category · {c.name}
                </Link>
              ))}
              {!suggest.isFetching &&
                !(suggest.data?.data.products ?? []).length &&
                !(suggest.data?.data.brands ?? []).length &&
                !(suggest.data?.data.categories ?? []).length && (
                  <p className="px-2 py-2 text-sm text-muted">No matches</p>
                )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-ink">
          <Link href={isAuthenticated ? "/account/wishlist" : loginUrl("/account/wishlist")} className="relative rounded-md p-2 transition hover:bg-background" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {wishCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-md bg-brand px-1 text-[10px] font-bold text-ink">
                {wishCount}
              </span>
            ) : null}
          </Link>
          <Link href={isAuthenticated ? "/cart" : loginUrl("/cart")} className="relative rounded-md p-2 transition hover:bg-background" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-md bg-brand px-1 text-[10px] font-bold text-ink">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link href={isAuthenticated ? "/account" : "/login"} className="rounded-md p-2 transition hover:bg-background" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface text-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="text-2xl font-bold">{SITE_NAME}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Clothing only — dresses, tops, bottoms, ethnic wear, and outerwear.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Shop</p>
          <Link href="/products" className="block text-sm text-ink/80 transition hover:text-ink">All clothing</Link>
          <Link href="/category/dresses" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Dresses</Link>
          <Link href="/category/tops" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Tops</Link>
          <Link href="/category/bottoms" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Bottoms</Link>
          <Link href="/category/ethnic-wear" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Ethnic Wear</Link>
          <Link href="/category/outerwear" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Outerwear</Link>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Help</p>
          <Link href="/contact" className="block text-sm text-ink/80 transition hover:text-ink">Contact</Link>
          <Link href="/privacy" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Privacy</Link>
          <Link href="/terms" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Terms</Link>
          <p className="mt-3 text-sm text-ink/80">Shipping in 2–5 days</p>
          <p className="mt-2 text-sm text-ink/80">7-day returns</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Account</p>
          <Link href="/login" className="block text-sm text-ink/80 transition hover:text-ink">Sign in</Link>
          <Link href="/account/orders" className="mt-2 block text-sm text-ink/80 transition hover:text-ink">Orders</Link>
        </div>
      </div>
    </footer>
  );
}
