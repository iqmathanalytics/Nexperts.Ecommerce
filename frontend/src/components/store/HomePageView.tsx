import Image from "next/image";
import Link from "next/link";
import { HeroSlideshow } from "@/components/store/HeroSlideshow";
import { ProductRail } from "@/components/store/ProductRail";
import { LookbookCarousel } from "@/components/store/LookbookCarousel";
import { Reveal } from "@/components/store/Reveal";
import { CampaignTile } from "@/components/store/CampaignTile";
import { CAMPAIGNS, DRESS_EDITS } from "@/lib/editorial";
import type { CategoryNode, ProductCard } from "@/lib/types";

export type HomeData = {
  categories: CategoryNode[];
  reviews: Array<{
    id: number;
    rating: number;
    title: string;
    comment: string;
    firstName: string;
  }>;
  featured?: ProductCard[];
  lookbooks?: Array<{
    id: number;
    slug: string;
    title: string;
    coverImageUrl: string | null;
    videoUrl?: string | null;
  }>;
};

const TICKER = ["Free shipping over ₹999", "WELCOME10 · 10% off", "FESTIVE20 · festive edit", "7-day returns", "FLAT200 · ₹200 off", "Member points"];

export function HomePageView({ data }: { data: HomeData }) {
  const featured = data.featured ?? [];
  const categories = data.categories ?? [];
  const lookbooks = data.lookbooks ?? [];

  return (
    <div className="bg-white text-ink">
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <HeroSlideshow />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-20 pt-40 md:px-8 md:pb-24">
          <p className="animate-rise nexperts-mark text-xs text-white/90 md:text-sm">Nexperts</p>
          <h1 className="animate-rise-delay-1 mt-5 max-w-2xl font-display text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl">
            New season.
            <br />
            Worn your way.
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-md text-sm text-white/80 md:text-base">
            Woman and Man clothing — dresses, layers, and festive pieces cut for India.
          </p>
          <div className="animate-rise-delay-3 mt-9 flex flex-wrap gap-3">
            <Link
              href="/women"
              className="inline-flex h-12 items-center bg-white px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-white/90"
            >
              Woman
            </Link>
            <Link
              href="/men"
              className="inline-flex h-12 items-center border border-white/70 bg-transparent px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              Man
            </Link>
            <Link
              href="/category/dresses"
              className="inline-flex h-12 items-center px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white underline-offset-4 hover:underline"
            >
              Dresses
            </Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-line bg-ink text-white">
        <div className="animate-marquee flex w-max gap-12 py-2.5 text-[10px] font-semibold uppercase tracking-[0.28em]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={`${t}-${i}`} className="opacity-85">
              {t}
              <span className="mx-6 text-accent">◆</span>
            </span>
          ))}
        </div>
      </div>

      <section className="grid md:grid-cols-2">
        {CAMPAIGNS.slice(0, 2).map((c) => (
          <CampaignTile key={c.href} {...c} tall />
        ))}
      </section>

      <CampaignTile {...CAMPAIGNS[2]!} />

      <section className="overflow-hidden bg-accent text-ink">
        <div className="animate-marquee-reverse flex w-max gap-10 py-3 text-[11px] font-semibold uppercase tracking-[0.22em]">
          {["WELCOME10", "First order 10% off", "FESTIVE20", "Celebration wear", "FLAT200", "₹200 off", "Free shipping ₹999+"].flatMap((t, i) => [
            <span key={`${t}-${i}`} className="px-2">
              {t}
            </span>,
          ]).concat(
            ["WELCOME10", "First order 10% off", "FESTIVE20", "Celebration wear", "FLAT200", "₹200 off", "Free shipping ₹999+"].map((t, i) => (
              <span key={`b-${t}-${i}`} className="px-2">
                {t}
              </span>
            )),
          )}
        </div>
      </section>

      {featured.length > 0 ? (
        <Reveal>
          <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">New in</p>
                <h2 className="mt-2 font-display text-3xl font-semibold md:text-5xl">This week</h2>
              </div>
              <Link href="/products?sort=newest" className="text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
                View all
              </Link>
            </div>
            <ProductRail products={featured.slice(0, 8)} />
          </section>
        </Reveal>
      ) : null}

      <section className="bg-surface-muted/50">
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-20">
          <Reveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">The dress view</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-5xl">Cut, drape, occasion</h2>
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {DRESS_EDITS.map((d, i) => (
              <Reveal key={d.href} delay={i * 0.08}>
                <Link href={d.href} className="group relative block min-h-[58vh] overflow-hidden bg-white">
                  <Image
                    src={d.image}
                    alt={d.title}
                    fill
                    quality={70}
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover object-[center_12%] transition duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">{d.label}</p>
                    <p className="mt-1 font-display text-3xl font-semibold text-white">{d.title}</p>
                    <span className="mt-3 inline-block text-[10px] uppercase tracking-[0.18em] text-white/80 opacity-0 transition duration-300 group-hover:opacity-100">
                      Shop the cut →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {lookbooks.length > 0 ? <LookbookCarousel items={lookbooks} /> : null}

      {categories.length > 0 ? (
        <section className="border-t border-line">
          <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Shop by category</p>
            <div className="mt-8 grid grid-cols-2 gap-px bg-line md:grid-cols-5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="group bg-white px-4 py-10 text-center transition hover:bg-ink hover:text-white"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] transition group-hover:tracking-[0.28em]">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1400px] gap-px bg-line md:grid-cols-3">
          {[
            { href: "/sale", title: "Sale", text: "Selected pieces, reduced." },
            { href: "/style-quiz", title: "Find your fit", text: "Five questions. Better sizing." },
            { href: "/account/loyalty", title: "Member", text: "Earn points on every order." },
          ].map((b) => (
            <Link key={b.href} href={b.href} className="group bg-white px-8 py-12 transition hover:bg-surface-muted">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">{b.title}</p>
              <p className="mt-2 text-sm text-muted">{b.text}</p>
              <span className="mt-4 inline-block translate-y-1 text-[10px] uppercase tracking-[0.18em] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
