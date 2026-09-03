"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/state";
import { CampaignHero } from "@/components/store/CampaignHero";
import { mergeEditorial, SALE_HERO, SALE_HERO_VIDEO, type StorefrontEditorial } from "@/lib/editorial";
import type { ProductCard } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function SaleClock({ endsAt }: { endsAt?: string | null }) {
  // null until mount — avoids SSR/client Date.now() mismatch on the timer digits
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let end: number;
    if (endsAt) {
      const parsed = new Date(endsAt).getTime();
      if (!Number.isNaN(parsed) && parsed > Date.now()) {
        end = parsed;
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        d.setHours(23, 59, 59, 0);
        end = d.getTime();
      }
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(23, 59, 59, 0);
      end = d.getTime();
    }

    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const parts =
    left == null
      ? [
          { l: "Days", v: "--" },
          { l: "Hrs", v: "--" },
          { l: "Mins", v: "--" },
          { l: "Secs", v: "--" },
        ]
      : (() => {
          const s = Math.floor(left / 1000);
          return [
            { l: "Days", v: pad(Math.floor(s / 86400)) },
            { l: "Hrs", v: pad(Math.floor((s % 86400) / 3600)) },
            { l: "Mins", v: pad(Math.floor((s % 3600) / 60)) },
            { l: "Secs", v: pad(s % 60) },
          ];
        })();

  return (
    <div className="mx-auto grid w-full max-w-[24.75rem] grid-cols-4 gap-2 sm:gap-2.5" role="timer" aria-label="Sale ends in">
      {parts.map((p) => (
        <div
          key={p.l}
          className="flex min-h-[4.75rem] flex-col items-center justify-center border border-accent/45 bg-ink/80 px-1 py-2.5 text-center backdrop-blur-md md:min-h-[5.25rem]"
        >
          <p className="font-display text-[1.7rem] font-medium leading-none tabular-nums text-accent md:text-[2.05rem]">{p.v}</p>
          <p className="mt-2 w-full text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-white/80">{p.l}</p>
        </div>
      ))}
    </div>
  );
}

export default function SalePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sale-products"],
    queryFn: () => api<ProductCard[]>("/products?sort=discount&limit=24"),
  });
  const editorial = useQuery({
    queryKey: ["editorial"],
    queryFn: () => api<StorefrontEditorial>("/editorial"),
    staleTime: 60_000,
  });
  const ed = mergeEditorial(editorial.data?.data);
  const onSale = (data?.data ?? []).filter((p) => p.discountPercent > 0);

  return (
    <div className="bg-background text-ink">
      <CampaignHero
        video={SALE_HERO_VIDEO}
        image={SALE_HERO}
        kicker="The sale room"
        title={"Selected pieces,\nreduced"}
        subtitle="Limited-time cuts for Woman and Man. Copy a code from the bar before checkout."
        actions={[
          { href: "/products?gender=WOMEN&sort=discount", label: "Woman", variant: "solid" },
          { href: "/products?gender=MEN&sort=discount", label: "Man", variant: "outline" },
        ]}
      >
        <SaleClock endsAt={ed.saleEndsAt || null} />
      </CampaignHero>
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
        <p className="font-display text-3xl font-medium italic tracking-tight md:text-4xl">On sale now</p>
        <p className="mt-2 max-w-lg text-sm text-muted">Markdowns on current-season silhouettes — while they last.</p>
        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ProductGrid products={onSale.length ? onSale : data?.data ?? []} dense />
          )}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Prefer browsing by department?{" "}
          <Link href="/women" className="underline underline-offset-4">
            Woman
          </Link>{" "}
          ·{" "}
          <Link href="/men" className="underline underline-offset-4">
            Man
          </Link>
        </p>
      </div>
    </div>
  );
}
