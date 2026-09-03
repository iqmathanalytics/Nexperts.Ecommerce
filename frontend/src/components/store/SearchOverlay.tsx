"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { fade, isModifiedClick } from "@/lib/motion";
import { categoryHref } from "@/lib/shop";

type Suggest = {
  products: Array<{ name: string; slug: string; sku?: string; brand?: string | null }>;
  categories: Array<{ name: string; slug: string }>;
  brands: Array<{ name: string; slug: string }>;
};

const TRENDING = ["Linen dress", "Anarkali", "Tailored trousers", "Silk blouse", "Oversized shirt"];

function recentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("nx_recent_searches") ?? "[]").slice(0, 6);
  } catch {
    return [];
  }
}

function pushRecent(term: string) {
  const next = [term, ...recentSearches().filter((t) => t !== term)].slice(0, 6);
  localStorage.setItem("nx_recent_searches", JSON.stringify(next));
}

export function SearchOverlay() {
  const router = useRouter();
  const { searchOpen, closeSearch, goToProduct } = useStoreUi();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const debouncedQ = useDebouncedValue(q, 150);

  const suggest = useQuery({
    queryKey: ["suggest", debouncedQ],
    queryFn: () => api<Suggest>(`/products/search/suggest?q=${encodeURIComponent(debouncedQ)}`),
    enabled: searchOpen && debouncedQ.length >= 2,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (searchOpen) {
      setRecent(recentSearches());
      setQ("");
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, closeSearch]);

  function go(term: string) {
    const t = term.trim();
    if (t) pushRecent(t);
    closeSearch();
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <AnimatePresence>
      {searchOpen ? (
        <motion.div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md" {...fade}>
          <div className="mx-auto max-w-3xl px-4 pt-20 md:pt-28">
            <div className="mb-6 flex justify-end">
              <button type="button" onClick={closeSearch} className="rounded-sm p-2 text-muted hover:text-ink" aria-label="Close search">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="relative">
              <Search className="pointer-events-none absolute left-0 top-3 h-5 w-5 text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clothing, brands, SKU"
                className="w-full border-b border-line bg-transparent py-3 pl-8 pr-4 font-display text-3xl font-medium outline-none placeholder:text-muted/60 md:text-4xl"
              />
            </form>

            {debouncedQ.length >= 2 ? (
              <div className="mt-8 space-y-2">
                {(suggest.data?.data.products ?? []).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/products/${p.slug}`}
                    onClick={(e) => {
                      closeSearch();
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      const href = `/products/${p.slug}`;
                      goToProduct({ href, name: p.name });
                      router.push(href);
                    }}
                    className="block border-b border-line py-3 transition hover:pl-1"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{[p.brand, p.sku].filter(Boolean).join(" · ")}</span>
                  </Link>
                ))}
                {(suggest.data?.data.categories ?? []).map((c) => (
                  <Link key={c.slug} href={categoryHref(c.slug)} onClick={closeSearch} className="block py-2 text-sm text-muted">
                    Category · {c.name}
                  </Link>
                ))}
                {!suggest.isFetching && !(suggest.data?.data.products ?? []).length ? (
                  <p className="py-4 text-sm text-muted">No matches — try another term.</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-10 grid gap-10 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Trending</p>
                  <ul className="mt-4 space-y-2">
                    {TRENDING.map((t) => (
                      <li key={t}>
                        <button type="button" onClick={() => go(t)} className="text-sm text-ink/80 transition hover:text-ink">
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {recent.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Recent</p>
                    <ul className="mt-4 space-y-2">
                      {recent.map((t) => (
                        <li key={t}>
                          <button type="button" onClick={() => go(t)} className="text-sm text-ink/80 transition hover:text-ink">
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <Link href="/visual-search" onClick={closeSearch} className="text-xs font-semibold uppercase tracking-[0.18em] underline-offset-4 hover:underline">
                    Try visual search
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
