"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageState, ProductCardSkeleton } from "@/components/ui/state";
import type { CategoryNode, ProductCard } from "@/lib/types";
import { categoryDisplayName, isWomenOnlyCategory, MEN_CATEGORY_NAV, MEN_PARENT_SLUGS, parseShopGender, type ShopGender } from "@/lib/shop";

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen((v) => !v)}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function CatalogInner({
  forcedCategory,
  forcedGender,
  hideHeading,
}: {
  forcedCategory?: string;
  forcedGender?: ShopGender;
  hideHeading?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [accum, setAccum] = useState<ProductCard[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentPage = Number(params.get("page") ?? 1);

  const apiQuery = useMemo(() => {
    const q = new URLSearchParams(params.toString());
    if (forcedCategory) q.set("category", forcedCategory);
    const gender = parseShopGender(q.get("gender")) ?? forcedGender;
    if (gender) q.set("gender", gender);
    else q.delete("gender");
    return q;
  }, [params, forcedCategory, forcedGender]);

  const filterKey = useMemo(() => {
    const q = new URLSearchParams(apiQuery.toString());
    q.delete("page");
    return q.toString();
  }, [apiQuery]);

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

  // Reset accumulation when filters change
  useEffect(() => {
    setAccum([]);
  }, [filterKey]);

  const products = useMemo(() => {
    const pageItems = data?.data ?? [];
    if (currentPage === 1) return pageItems;
    const map = new Map<number, ProductCard>();
    [...accum, ...pageItems].forEach((p) => map.set(p.id, p));
    return [...map.values()];
  }, [data?.data, accum, currentPage]);

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
      if (forcedCategory) next.set("category", forcedCategory);
      if (forcedGender) next.set("gender", forcedGender);
    });
  }

  function loadMore() {
    const nextPage = currentPage + 1;
    setAccum(products);
    setFilter("page", String(nextPage));
  }

  const meta = data?.meta;
  const categoryValue = params.get("category") ?? forcedCategory ?? "";
  const activeGender = forcedGender ?? parseShopGender(params.get("gender"));
  const visibleCats = (cats.data?.data ?? []).filter((c) => {
    if (activeGender === "MEN") return !isWomenOnlyCategory(c.slug) && !MEN_PARENT_SLUGS.has(c.slug);
    return true;
  });
  const menChips = activeGender === "MEN" ? MEN_CATEGORY_NAV : null;
  const flatCats = (activeGender === "MEN"
    ? [
        ...MEN_CATEGORY_NAV.map((item) => ({ id: item.slug, slug: item.slug, label: item.label })),
        ...visibleCats.flatMap((c) => [
          { id: String(c.id), slug: c.slug, label: c.name },
          ...c.children
            .filter((child) => !isWomenOnlyCategory(child.slug) && !MEN_PARENT_SLUGS.has(child.slug))
            .map((child) => ({ id: String(child.id), slug: child.slug, label: `${c.name} · ${categoryDisplayName(child.slug, child.name, "MEN")}` })),
        ]),
      ]
    : visibleCats.flatMap((c) => [
        { id: String(c.id), slug: c.slug, label: c.name },
        ...c.children.map((child) => ({ id: String(child.id), slug: child.slug, label: `${c.name} · ${child.name}` })),
      ])
  ).filter((c, i, all) => all.findIndex((x) => x.slug === c.slug) === i);
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
  const brandColors = ["#1a1a1a", "#8b7355", "#c4a35a", "#5c6b4a", "#6b4c3b", "#2c3e50"];

  return (
    <div className="bg-background pb-8 text-ink md:pb-0">
      {!hideHeading ? (
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Clothing</p>
            <h1 className="mt-3 font-display text-4xl font-medium italic tracking-tight text-ink md:text-6xl">
              {pathname === "/search"
                ? "Search"
                : activeGender === "WOMEN"
                  ? "Woman"
                  : activeGender === "MEN"
                    ? "Man"
                    : "Shop"}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted md:text-base">
              {activeGender
                ? "Pieces for this collection — filter by category, brand, and price."
                : "Filter by category, brand, and price — then bag your look."}
            </p>
          </div>
        </section>
      ) : null}

      {!forcedCategory && (cats.data?.data?.length ?? 0) > 0 ? (
        <div className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 md:px-6">
            <button
              type="button"
              onClick={() => setFilter("category", "")}
              className={`btn-chip inline-flex shrink-0 items-center justify-center px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                !categoryValue ? "btn-chip-active" : ""
              }`}
            >
              All
            </button>
            {(menChips ?? visibleCats).map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setFilter("category", c.slug)}
                className={`btn-chip inline-flex shrink-0 items-center justify-center px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  categoryValue === c.slug ? "btn-chip-active" : ""
                }`}
              >
                {"label" in c ? c.label : c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex h-11 w-full items-center justify-between border border-line bg-surface px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            Filters
            <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <aside className={`h-fit lg:sticky lg:top-[calc(var(--store-chrome)+1rem)] ${filtersOpen ? "block" : "hidden"} lg:block`}>
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-semibold">Filters</p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted underline-offset-2 hover:underline">
                Clear
              </button>
            ) : null}
          </div>

          <FilterSection title="Search">
            <Input
              key={`q-${params.get("q") ?? ""}`}
              defaultValue={params.get("q") ?? ""}
              placeholder="Name or SKU"
              onKeyDown={(e) => {
                if (e.key === "Enter") setFilter("q", e.currentTarget.value);
              }}
              onBlur={(e) => setFilter("q", e.target.value)}
            />
          </FilterSection>

          {!forcedCategory ? (
            <FilterSection title="Category">
              <Select value={categoryValue} onChange={(e) => setFilter("category", e.target.value)}>
                <option value="">All</option>
                {flatCats.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FilterSection>
          ) : null}

          <FilterSection title="Brand">
            <div className="flex flex-wrap gap-2">
              {(brands.data?.data ?? []).map((b, i) => {
                const active = params.get("brand") === b.slug;
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => setFilter("brand", active ? "" : b.slug)}
                    className={`btn-chip inline-flex items-center gap-2 px-2.5 py-1.5 text-xs transition ${
                      active ? "btn-chip-active" : ""
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: brandColors[i % brandColors.length] }} />
                    {b.name}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Gender">
            <div className="flex flex-wrap gap-2">
              {(forcedGender && forcedCategory && isWomenOnlyCategory(forcedCategory)
                ? ([["WOMEN", "Women"]] as const)
                : forcedGender
                  ? ([
                      ["WOMEN", "Women"],
                      ["MEN", "Men"],
                    ] as const)
                  : ([
                      ["", "All"],
                      ["WOMEN", "Women"],
                      ["MEN", "Men"],
                    ] as const)
              ).map(([v, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFilter("gender", v)}
                  className={`btn-chip inline-flex items-center justify-center px-3 py-1.5 text-xs transition ${
                    (activeGender ?? "") === v ? "btn-chip-active" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              <Input
                key={`min-${params.get("minPrice") ?? ""}`}
                type="number"
                placeholder="Min RM"
                defaultValue={params.get("minPrice") ?? ""}
                onBlur={(e) => setFilter("minPrice", e.target.value)}
              />
              <Input
                key={`max-${params.get("maxPrice") ?? ""}`}
                type="number"
                placeholder="Max RM"
                defaultValue={params.get("maxPrice") ?? ""}
                onBlur={(e) => setFilter("maxPrice", e.target.value)}
              />
            </div>
          </FilterSection>

          <FilterSection title="Availability" defaultOpen={false}>
            <Select value={params.get("inStock") ?? ""} onChange={(e) => setFilter("inStock", e.target.value)}>
              <option value="">All</option>
              <option value="true">In stock</option>
              <option value="false">Out of stock</option>
            </Select>
          </FilterSection>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{meta ? `${meta.total} pieces` : "Loading…"}</p>
            <Select value={params.get("sort") ?? "relevance"} onChange={(e) => setFilter("sort", e.target.value)} className="w-full max-w-xs sm:w-52">
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
              <option value="discount">Discount</option>
            </Select>
          </div>

          <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : ""}>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : null}
            {isError ? <PageState title="Could not load products" /> : null}
            {!isLoading && !isError ? <ProductGrid products={products} /> : null}

            {meta && currentPage < meta.totalPages ? (
              <div className="mt-12 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={isFetching}>
                  {isFetching ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
