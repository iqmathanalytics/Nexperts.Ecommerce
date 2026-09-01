import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSlideshow } from "@/components/store/HeroSlideshow";
import type { CategoryNode } from "@/lib/types";

export type HomeData = {
  categories: CategoryNode[];
  reviews: Array<{
    id: number;
    rating: number;
    title: string;
    comment: string;
    firstName: string;
  }>;
};

const categoryVisuals: Record<string, { image: string; line: string }> = {
  dresses: {
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=900&q=75",
    line: "Casual, evening, party, maxi, midi, and mini.",
  },
  tops: {
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&h=900&q=75",
    line: "Shirts, blouses, and everyday layers.",
  },
  bottoms: {
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&h=900&q=75",
    line: "Trousers and tailored pants.",
  },
  "ethnic-wear": {
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&h=900&q=75",
    line: "Anarkalis, kurtas, and festive dressing.",
  },
  outerwear: {
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&h=900&q=75",
    line: "Coats and jackets for every season.",
  },
};

const fallbackVisual = {
  image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=900&q=75",
  line: "Browse the clothing collection.",
};

export function HomePageView({ data }: { data: HomeData }) {
  const categories = data.categories ?? [];
  const reviews = data.reviews ?? [];

  return (
    <div className="bg-background text-ink">
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-24 md:px-6">
        <HeroSlideshow />
        <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
          <p className="animate-rise text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-[#e8c56a] md:text-xs">
            Premium clothing
          </p>
          <div className="animate-rise">
            <h1 className="hero-wordmark mt-4 font-semibold leading-none tracking-[0.08em] text-[clamp(2.4rem,7vw,4.75rem)]">
              Nexperts
            </h1>
          </div>
          <div className="animate-rise mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#e8c56a] to-transparent" />
          <p className="animate-rise-delay-1 mx-auto mt-6 max-w-xl text-lg font-medium tracking-wide text-[#f6e7b2] md:text-xl">
            Clothing, only.
          </p>
          <p className="animate-rise-delay-2 mx-auto mt-3 max-w-lg text-sm text-white/80 md:text-base">
            Dresses, tops, bottoms, ethnic wear, and outerwear — shop by category and find your fit.
          </p>
          <div className="animate-rise-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              prefetch
              className="inline-flex h-12 items-center gap-2 rounded-md bg-brand px-7 text-sm font-bold text-ink transition hover:bg-brand-deep"
            >
              Way to shop
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#collections"
              className="inline-flex h-12 items-center rounded-md border border-white/50 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Shop collections
            </a>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Nexperts Clothing</p>
            <p className="text-xs text-muted">Shop the full collection</p>
          </div>
          <Link href="/products" className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-bold text-ink">
            Way to shop
          </Link>
        </div>
      </div>

      {categories.length > 0 && (
        <section id="collections" className="scroll-mt-24 bg-background">
          <div className="mx-auto max-w-6xl px-4 pb-6 pt-16 md:px-6 md:pt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink/70">Collections</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-5xl">Shop by category</h2>
          </div>
          <div className="space-y-4 px-4 md:px-6">
            {categories.map((c, index) => {
              const visual = categoryVisuals[c.slug] ?? fallbackVisual;
              const reverse = index % 2 === 1;
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  prefetch
                  className={`group relative mx-auto grid min-h-[400px] max-w-6xl overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-2 ${
                    reverse ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative min-h-[240px] overflow-hidden bg-background">
                    <Image
                      src={visual.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      loading={index === 0 ? "eager" : "lazy"}
                      className="object-cover object-[center_top] transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-center px-6 py-10 md:px-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{c.name}</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted md:text-base">
                      {visual.line}
                      {c.children.length ? ` ${c.children.map((child) => child.name).join(" · ")}.` : ""}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink transition group-hover:gap-3">
                      Explore collection <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mx-auto flex max-w-6xl justify-center px-4 py-14 md:px-6">
            <Link
              href="/products"
              prefetch
              className="inline-flex h-12 items-center gap-2 rounded-md bg-brand px-8 text-sm font-bold text-ink transition hover:bg-brand-deep"
            >
              Way to shop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink/70">Social proof</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-5xl">Trusted by customers</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {reviews.map((r) => (
                <blockquote key={r.id} className="rounded-xl border border-line bg-background p-6">
                  <p className="text-lg font-semibold leading-snug text-ink">{r.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{r.comment}</p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                    {r.firstName} · {r.rating}/5
                  </p>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
