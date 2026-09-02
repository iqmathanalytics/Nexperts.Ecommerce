"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/state";
import { OFFERS } from "@/components/store/OfferTheatre";
import type { ProductCard } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function SaleClock() {
  const end = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 59, 0);
    return d.getTime();
  }, []);
  const [left, setLeft] = useState(end - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setLeft(Math.max(0, end - Date.now())), 1000);
    return () => window.clearInterval(id);
  }, [end]);

  const s = Math.floor(left / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts = [
    { l: "Days", v: pad(days) },
    { l: "Hours", v: pad(hours) },
    { l: "Mins", v: pad(mins) },
    { l: "Secs", v: pad(secs) },
  ];

  return (
    <div className="mt-8 flex gap-3">
      {parts.map((p) => (
        <div key={p.l} className="min-w-16 border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
          <p className="font-display text-2xl font-semibold tabular-nums md:text-3xl">{p.v}</p>
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/70">{p.l}</p>
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

  const onSale = (data?.data ?? []).filter((p) => p.discountPercent > 0);

  return (
    <div className="bg-white text-ink">
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="offer-shimmer pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
          <p className="nexperts-mark animate-rise text-[10px] text-white/60">Nexperts</p>
          <h1 className="animate-rise-delay-1 mt-3 font-display text-5xl font-semibold md:text-7xl">Sale</h1>
          <p className="animate-rise-delay-2 mt-4 max-w-lg text-sm text-white/75">
            Selected pieces, reduced. Codes rotate in the bar above — copy one before checkout.
          </p>
          <SaleClock />
          <div className="mt-8 flex flex-wrap gap-2">
            {OFFERS.filter((o) => o.code !== "FREE").map((o) => (
              <span key={o.code} className="border border-white/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
                {o.code}
              </span>
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ProductGrid products={onSale.length ? onSale : data?.data ?? []} dense />
        )}
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
