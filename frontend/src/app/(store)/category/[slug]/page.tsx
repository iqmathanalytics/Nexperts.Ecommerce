"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CatalogInner } from "@/components/store/Catalog";
import { ProductGrid } from "@/components/store/ProductCard";
import { PageState, Spinner } from "@/components/ui/state";
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
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }
  if (cat.isError || !cat.data) return <PageState title="Category not found" />;

  const category = cat.data.data;
  const childHref = (childSlug: string) => categoryHref(childSlug, gender);

  return (
    <div className="bg-background text-ink">
      {category.imageUrl ? (
        <div className="relative min-h-[52svh] overflow-hidden bg-brand md:min-h-[62svh]">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            priority
            quality={70}
            sizes="100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-10 md:pb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">
              {gender ? `${shopGenderLabel(gender)} · Clothing` : "Clothing category"}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">{category.name}</h1>
            {category.description ? <p className="mt-3 max-w-2xl text-sm text-white/80">{category.description}</p> : null}
            {category.children.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={childHref(child.slug)}
                    className="btn-store border border-white/70 bg-black/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#1c1915]"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
              {gender ? `${shopGenderLabel(gender)} · Clothing` : "Clothing category"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{category.name}</h1>
            {category.description ? <p className="mt-3 max-w-2xl text-muted">{category.description}</p> : null}
            {category.children.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={childHref(child.slug)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:border-ink hover:text-ink"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
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
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
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
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      }
    >
      <CategoryInner />
    </Suspense>
  );
}
