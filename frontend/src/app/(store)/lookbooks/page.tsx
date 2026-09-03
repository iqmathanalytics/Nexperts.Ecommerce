"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHero } from "@/components/store/PageHero";
import { PageState, Skeleton } from "@/components/ui/state";

type LookbookCard = {
  id: number;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  videoUrl?: string | null;
};

export default function LookbooksIndexPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["lookbooks"],
    queryFn: () => api<LookbookCard[]>("/lookbooks"),
  });
  const lookbooks = data?.data ?? [];

  return (
    <div className="bg-background text-ink">
      <PageHero
        image={lookbooks[0]?.coverImageUrl}
        kicker="Editorial"
        title="Lookbooks"
        subtitle="Shop the season through curated stories and silhouettes."
        focal="center"
      />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>
        ) : isError ? (
          <PageState title="Could not load lookbooks" />
        ) : lookbooks.length === 0 ? (
          <PageState title="No lookbooks yet" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lookbooks.map((lb) => (
              <Link key={lb.id} href={`/lookbooks/${lb.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
                  {lb.coverImageUrl ? (
                    <Image
                      src={lb.coverImageUrl}
                      alt=""
                      fill
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Lookbook</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">{lb.title}</h2>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
