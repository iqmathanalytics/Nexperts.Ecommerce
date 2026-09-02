"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { PageHero } from "@/components/store/PageHero";
import { PageState, Skeleton } from "@/components/ui/state";
import type { ProductCard } from "@/lib/types";

export default function DesignerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["designer", slug],
    queryFn: () =>
      api<{
        brand: { name: string; slug: string; description: string | null; heroImageUrl?: string | null; lookbookBio?: string | null };
        products: ProductCard[];
        lookbooks: Array<{ id: number; slug: string; title: string; coverImageUrl: string | null }>;
      }>(`/designers/${slug}/collection`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-12">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }
  if (isError || !data?.data) return <PageState title="Designer not found" />;

  const { brand, products, lookbooks } = data.data;

  return (
    <div>
      <PageHero
        image={brand.heroImageUrl}
        kicker="Designer"
        title={brand.name}
        subtitle={brand.lookbookBio || brand.description}
        focal="center"
      />
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <h2 className="font-display text-3xl font-semibold">Collection</h2>
        <div className="mt-8">
          <ProductGrid products={products ?? []} />
        </div>
        {(lookbooks?.length ?? 0) > 0 ? (
          <div className="mt-16">
            <h2 className="font-display text-3xl font-semibold">Lookbooks</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lookbooks.map((l) => (
                <a key={l.id} href={`/lookbooks/${l.slug}`} className="group relative aspect-[4/5] overflow-hidden bg-surface-muted">
                  {l.coverImageUrl ? <Image src={l.coverImageUrl} alt="" fill className="object-cover object-center" sizes="33vw" /> : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                    <p className="font-display text-2xl">{l.title}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
