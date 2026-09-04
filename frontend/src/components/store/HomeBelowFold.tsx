"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ProductRail } from "@/components/store/ProductRail";
import { Reveal } from "@/components/store/Reveal";
import type { ProductCard } from "@/lib/types";

const AmbientScene = dynamic(
  () => import("@/components/store/AmbientScene").then((m) => m.AmbientScene),
  { ssr: false },
);

const LookbookCarousel = dynamic(
  () => import("@/components/store/LookbookCarousel").then((m) => m.LookbookCarousel),
  { ssr: false },
);

type Lookbook = {
  id: number;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  videoUrl?: string | null;
};

type DressEdit = {
  href: string;
  label: string;
  title?: string;
  image: string;
};

/** Below-fold home blocks — deferred client chunks so the hero stays light. */
export function HomeBelowFold({
  featured,
  dressEdits,
  lookbooks,
}: {
  featured: ProductCard[];
  dressEdits: DressEdit[];
  lookbooks: Lookbook[];
}) {
  return (
    <>
      {featured.length > 0 ? (
        <section className="relative overflow-hidden">
          <AmbientScene />
          <Reveal>
            <div className="relative mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">New drop</p>
                  <h2 className="mt-2 font-display text-3xl font-medium italic md:text-6xl">This week’s silhouettes</h2>
                </div>
                <Link href="/products?sort=newest" className="text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
                  View all
                </Link>
              </div>
              <ProductRail products={featured.slice(0, 8)} />
            </div>
          </Reveal>
        </section>
      ) : null}

      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-20">
          <Reveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">The dress studio</p>
            <h2 className="mt-2 max-w-xl font-display text-3xl font-medium italic md:text-5xl">Cut, drape, occasion</h2>
          </Reveal>
          <div className="mt-12 grid items-end gap-8 md:grid-cols-3">
            {dressEdits.map((d, i) => (
              <Reveal key={d.href} delay={i * 0.08} className={i === 1 ? "md:-translate-y-10" : i === 2 ? "md:translate-y-6" : ""}>
                <Link href={d.href} className="group relative block">
                  <div className="product-arch relative aspect-[3/4] overflow-hidden bg-surface-muted shadow-[0_40px_80px_-40px_rgba(28,25,21,0.5)]">
                    <Image
                      src={d.image}
                      alt={d.title ?? d.label}
                      fill
                      quality={70}
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover object-top"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-7">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">{d.label}</p>
                      <p className="mt-1 font-display text-3xl font-semibold text-white">{d.title ?? d.label}</p>
                      <span className="mt-3 inline-block text-[10px] uppercase tracking-[0.18em] text-white/80 opacity-0 transition duration-300 group-hover:opacity-100">
                        Shop the cut →
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {lookbooks.length > 0 ? <LookbookCarousel items={lookbooks} /> : null}
    </>
  );
}
