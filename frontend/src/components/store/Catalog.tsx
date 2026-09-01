"use client";

import { startTransition, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageState, Spinner } from "@/components/ui/state";
import type { CategoryNode, ProductCard } from "@/lib/types";

function visiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  return [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function CatalogInner({ forcedCategory, hideHeading }: { forcedCategory?: string; hideHeading?: boolean }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const apiQuery = useMemo(() => {
    const q = new URLSearchParams(params.toString());
    if (forcedCategory) q.set("category", forcedCategory);
    return q;
  }, [params, forcedCategory]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["products", pathname, apiQuery.toString()],
    queryFn: () => api<ProductCard[]>(`/products?${apiQuery.toString()}`),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<CategoryNode[]>("/categories"),
    staleTime: 10 * 60_000,
  });
  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: () => api<Array<{ name: string; slug: string }>>("/brands"),
    staleTime: 10 * 60_000,
  });

  const pushParams = useCallback(
    (update: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      update(next);
      if (forcedCategory) next.set("category", forcedCategory);
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [params, pathname, router, forcedCategory],
  );

  function setFilter(key: string, value: string) {
    pushParams((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.set("page", "1");
    });
  }

  function clearFilters() {
    pushParams((next) => {
      const keepQ = next.get("q");
      [...next.keys()].forEach((k) => next.delete(k));
      if (keepQ && pathname === "/search") next.set("q", keepQ);
    });
  }

  const meta = data?.meta;
  const currentPage = Number(params.get("page") ?? 1);
  const categoryValue = params.get("category") ?? forcedCategory ?? "";
  const flatCats = (cats.data?.data ?? []).flatMap((c) => [
    { ...c, label: c.name },
    ...c.children.map((child) => ({ ...child, label: `${c.name} · ${child.name}` })),
  ]);
  const hasFilters = Boolean(
    params.get("q") ||
      params.get("category") ||
      params.get("gender") ||
      params.get("brand") ||
      params.get("minPrice") ||
      params.get("maxPrice") ||
      params.get("minRating") ||
      params.get("inStock") ||
      (params.get("sort") && params.get("sort") !== "relevance"),
  );

  return (
    <div className="bg-background text-ink">
      {!hideHeading ? (
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink/70">Clothing</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              {pathname === "/search" ? "Search clothing" : "Shop clothing"}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted md:text-base">
              Filter by category, brand, size availability, and price — then bag your look.
            </p>
          </div>
        </section>
      ) : null}

      {!forcedCategory && (cats.data?.data?.length ?? 0) > 0 ? (
        <div className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4">
            <button
              type="button"
              onClick={() => setFilter("category", "")}
              className={`shrink-0 rounded-md border px-3 py-2 text-sm transition ${
                !categoryValue ? "border-ink bg-ink text-white font-semibold" : "border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              All
            </button>
            {(cats.data?.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter("category", c.slug)}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm transition ${
                  categoryValue === c.slug
                    ? "border-ink bg-ink text-white font-semibold"
                    : "border-line text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Filters</p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-ink underline-offset-2 hover:underline">
                Clear all
              </button>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Search</p>
            <Input
              key={`q-${params.get("q") ?? ""}`}
              defaultValue={params.get("q") ?? ""}
              placeholder="Name or SKU"
              onKeyDown={(e) => {
                if (e.key === "Enter") setFilter("q", e.currentTarget.value);
              }}
              onBlur={(e) => setFilter("q", e.target.value)}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Category</p>
            <Select value={categoryValue} onChange={(e) => setFilter("category", e.target.value)} disabled={Boolean(forcedCategory)}>
              <option value="">All</option>
              {flatCats.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Gender</p>
            <Select value={params.get("gender") ?? ""} onChange={(e) => setFilter("gender", e.target.value)}>
              <option value="">All</option>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
              <option value="UNISEX">Unisex</option>
            </Select>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Brand</p>
            <Select value={params.get("brand") ?? ""} onChange={(e) => setFilter("brand", e.target.value)}>
              <option value="">All</option>
              {(brands.data?.data ?? []).map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              key={`min-${params.get("minPrice") ?? ""}`}
              type="number"
              placeholder="Min ₹"
              defaultValue={params.get("minPrice") ?? ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") setFilter("minPrice", e.currentTarget.value);
              }}
              onBlur={(e) => setFilter("minPrice", e.target.value)}
            />
            <Input
              key={`max-${params.get("maxPrice") ?? ""}`}
              type="number"
              placeholder="Max ₹"
              defaultValue={params.get("maxPrice") ?? ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") setFilter("maxPrice", e.currentTarget.value);
              }}
              onBlur={(e) => setFilter("maxPrice", e.target.value)}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Rating</p>
            <Select value={params.get("minRating") ?? ""} onChange={(e) => setFilter("minRating", e.target.value)}>
              <option value="">Any</option>
              <option value="4">4+</option>
              <option value="3">3+</option>
            </Select>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Availability</p>
            <Select value={params.get("inStock") ?? ""} onChange={(e) => setFilter("inStock", e.target.value)}>
              <option value="">All</option>
              <option value="true">In stock</option>
              <option value="false">Out of stock</option>
            </Select>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
            Reset filters
          </Button>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            {hideHeading ? (
              <p className="text-sm text-muted">Filter and sort this collection</p>
            ) : (
              <p className="text-sm text-muted">{meta ? `${meta.total} products` : "Loading catalog…"}</p>
            )}
            <Select value={params.get("sort") ?? "relevance"} onChange={(e) => setFilter("sort", e.target.value)} className="w-52">
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
              <option value="discount">Discount</option>
            </Select>
          </div>
          <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : "transition-opacity"}>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            ) : null}
            {isError ? <PageState title="Could not load products" /> : null}
            {data ? <ProductGrid products={data.data} /> : null}
            {meta && meta.totalPages > 1 ? (
              <div className="mt-8 flex justify-center gap-2">
                {visiblePages(currentPage, meta.totalPages).map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showGap = prev != null && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center gap-2">
                      {showGap ? <span className="px-1 text-muted">…</span> : null}
                      <button
                        type="button"
                        onClick={() => setFilter("page", String(p))}
                        className={`h-9 w-9 rounded-md text-sm font-semibold ${
                          currentPage === p ? "bg-ink text-white" : "border border-line bg-surface text-ink"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
