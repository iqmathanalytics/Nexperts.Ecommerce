"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { PageState, ProductCardSkeleton } from "@/components/ui/state";
import type { ProductCard } from "@/lib/types";

export default function SeasonalCollectionPage() {
  const { season } = useParams<{ season: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seasonal", season],
    queryFn: () =>
      api<{ name: string; description: string | null; products: ProductCard[] }>(`/collections/seasonal/${season}`),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.data) return <PageState title="Collection not found" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Seasonal</p>
      <h1 className="mt-3 font-display text-4xl font-semibold capitalize md:text-6xl">{data.data.name || season}</h1>
      {data.data.description ? <p className="mt-4 max-w-2xl text-sm text-muted">{data.data.description}</p> : null}
      <div className="mt-12">
        <ProductGrid products={data.data.products ?? []} />
      </div>
    </div>
  );
}
