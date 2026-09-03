"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHero } from "@/components/store/PageHero";
import { PageState, Skeleton } from "@/components/ui/state";

type BrandCard = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  heroImageUrl?: string | null;
};

export default function DesignersIndexPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["brands"],
    queryFn: () => api<BrandCard[]>("/brands"),
  });
  const brands = data?.data ?? [];

  return (
    <div className="bg-background text-ink">
      <PageHero
        image={brands[0]?.heroImageUrl ?? brands[0]?.logoUrl}
        kicker="House"
        title="Designers"
        subtitle="Explore the labels that shape the Nexperts wardrobe."
        focal="center"
      />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full" />
            ))}
          </div>
        ) : isError ? (
          <PageState title="Could not load designers" />
        ) : brands.length === 0 ? (
          <PageState title="No designers yet" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <Link key={b.id} href={`/designers/${b.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
                  {b.heroImageUrl || b.logoUrl ? (
                    <Image
                      src={b.heroImageUrl || b.logoUrl!}
                      alt=""
                      fill
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Designer</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">{b.name}</h2>
                {b.description ? <p className="mt-2 line-clamp-2 text-sm text-muted">{b.description}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
