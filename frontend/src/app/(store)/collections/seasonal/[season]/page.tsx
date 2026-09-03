"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { PageHero } from "@/components/store/PageHero";
import { PageState, ProductCardSkeleton } from "@/components/ui/state";
import type { ProductCard } from "@/lib/types";

export default function SeasonalCollectionPage() {
  const { season } = useParams<{ season: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seasonal", season],
    queryFn: () =>
      api<{ name: string; description: string | null; imageUrl?: string | null; products: ProductCard[] }>(
        `/collections/seasonal/${season}`,
      ),
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

  const collection = data.data;

  return (
    <div className="bg-background text-ink">
      <PageHero
        image={collection.imageUrl}
        kicker="Seasonal"
        title={collection.name || String(season)}
        subtitle={collection.description}
        focal="center"
        backHref="/"
      />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <ProductGrid products={collection.products ?? []} />
      </div>
    </div>
  );
}
