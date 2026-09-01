"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CatalogInner } from "@/components/store/Catalog";
import { PageState, Spinner } from "@/components/ui/state";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  children: Array<{ id: number; name: string; slug: string }>;
};

function CategoryInner() {
  const { slug } = useParams<{ slug: string }>();
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

  return (
    <div className="bg-background text-ink">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Clothing category</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{category.name}</h1>
          {category.description ? <p className="mt-3 max-w-2xl text-muted">{category.description}</p> : null}
          {category.children.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:border-ink hover:text-ink"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <CatalogInner forcedCategory={slug} hideHeading />
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
