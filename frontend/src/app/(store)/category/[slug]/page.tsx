"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CatalogInner } from "@/components/store/Catalog";
import { ProductGrid } from "@/components/store/ProductCard";
import { PageHero } from "@/components/store/PageHero";
import { PageState, PageLoader } from "@/components/ui/state";
import { categoryHref, inferCategoryGender, shopGenderLabel } from "@/lib/shop";
import type { ProductCard } from "@/lib/types";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  children: Array<{ id: number; name: string; slug: string }>;
};

function CategoryInner() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const gender = inferCategoryGender(slug, params.get("gender"));
  const cat = useQuery({
    queryKey: ["category", slug],
    queryFn: () => api<Category>(`/categories/${slug}`),
    enabled: Boolean(slug),
  });

  if (cat.isLoading) {
    return <PageLoader label="Loading category" />;
  }
  if (cat.isError || !cat.data) return <PageState title="Category not found" />;

  const category = cat.data.data;
  const childHref = (childSlug: string) => categoryHref(childSlug, gender);
  const kicker = gender ? `${shopGenderLabel(gender)} · Clothing` : "Clothing category";

  return (
    <div className="bg-background text-ink">
      <PageHero
        image={category.imageUrl}
        kicker={kicker}
        title={category.name}
        subtitle={category.description}
        focal="center"
        backHref={gender === "MEN" ? "/men" : gender === "WOMEN" ? "/women" : "/products"}
      >
        {category.children.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={childHref(child.slug)}
                className="btn-store btn-hero-outline rounded-sm border border-white/80 bg-[rgba(244,239,230,0.9)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#123028] hover:bg-white"
              >
                {child.name}
              </Link>
            ))}
          </div>
        ) : null}
      </PageHero>
      {gender ? (
        <CatalogInner forcedCategory={slug} forcedGender={gender} hideHeading />
      ) : (
        <CategoryGenderSplit slug={slug} name={category.name} />
      )}
    </div>
  );
}

function CategoryGenderSplit({ slug, name }: { slug: string; name: string }) {
  const women = useQuery({
    queryKey: ["products", "cat", slug, "WOMEN"],
    queryFn: () => api<ProductCard[]>(`/products?category=${slug}&gender=WOMEN&limit=12`),
  });
  const men = useQuery({
    queryKey: ["products", "cat", slug, "MEN"],
    queryFn: () => api<ProductCard[]>(`/products?category=${slug}&gender=MEN&limit=12`),
  });
  const womenItems = women.data?.data ?? [];
  const menItems = men.data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 md:px-6">
      <p className="text-sm text-muted">Shop {name.toLowerCase()} by collection — woman and man are listed separately.</p>
      {women.isLoading || men.isLoading ? (
        <PageLoader label="Loading pieces" compact />
      ) : (
        <>
          {womenItems.length ? (
            <section>
              <div className="mb-6 flex items-end justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">Woman</h2>
                <Link href={categoryHref(slug, "WOMEN")} className="text-[11px] font-semibold uppercase tracking-[0.14em] underline-offset-4 hover:underline">
                  View all
                </Link>
              </div>
              <ProductGrid products={womenItems} dense />
            </section>
          ) : null}
          {menItems.length ? (
            <section>
              <div className="mb-6 flex items-end justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">Man</h2>
                <Link href={categoryHref(slug, "MEN")} className="text-[11px] font-semibold uppercase tracking-[0.14em] underline-offset-4 hover:underline">
                  View all
                </Link>
              </div>
              <ProductGrid products={menItems} dense />
            </section>
          ) : null}
          {!womenItems.length && !menItems.length ? <PageState title="No pieces in this category yet" /> : null}
        </>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading category" />}>
      <CategoryInner />
    </Suspense>
  );
}
