"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
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
      <section className="relative flex min-h-[50vh] items-end bg-ink text-white">
        {brand.heroImageUrl ? (
          <Image src={brand.heroImageUrl} alt="" fill className="object-cover object-center opacity-90" sizes="100vw" priority />
        ) : null}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">Designer</p>
          <h1 className="mt-3 font-display text-5xl font-semibold md:text-6xl">{brand.name}</h1>
          <p className="mt-4 max-w-xl text-sm text-white/75">{brand.lookbookBio || brand.description}</p>
        </div>
      </section>
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
