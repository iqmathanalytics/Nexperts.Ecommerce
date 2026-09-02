import Image from "next/image";
import Link from "next/link";
import { fetchPublicApi } from "@/lib/server-api";
import { ProductGrid } from "@/components/store/ProductCard";
import { Reveal } from "@/components/store/Reveal";
import { DRESS_EDITS, WOMEN_HERO, WOMEN_TILES } from "@/lib/editorial";
import type { ProductCard } from "@/lib/types";

export const revalidate = 120;

export default async function WomenHubPage() {
  const products = await fetchPublicApi<ProductCard[]>("/products?gender=WOMEN&sort=newest&limit=12", 120).catch(
    () => [] as ProductCard[],
  );
  const list = Array.isArray(products) ? products : [];

  return (
    <div className="bg-white text-ink">
      <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-surface-muted md:min-h-[78vh]">
        <Image src={WOMEN_HERO} alt="Woman" fill priority quality={60} className="object-cover object-[center_18%]" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-12 md:px-8">
          <p className="nexperts-mark animate-rise text-[10px] text-white/80">Nexperts</p>
          <h1 className="animate-rise-delay-1 mt-2 font-display text-5xl font-semibold text-white md:text-7xl">Woman</h1>
          <p className="animate-rise-delay-2 mt-3 max-w-md text-sm text-white/80">
            Dresses, layers, and festive pieces — new season silhouettes.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {WOMEN_TILES.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:border-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
          {WOMEN_TILES.map((l) => (
            <Link key={l.href} href={l.href} className="group relative aspect-[3/4] overflow-hidden bg-surface-muted">
              <Image
                src={l.image}
                alt={l.label}
                fill
                quality={70}
                className="object-cover object-[center_12%] transition duration-500 group-hover:scale-[1.04]"
                sizes="20vw"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        <Reveal>
          <div className="mt-16">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">The dress view</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Occasion, length, drape</h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {DRESS_EDITS.map((d) => (
                <Link key={d.href} href={d.href} className="group relative min-h-[48vh] overflow-hidden bg-surface-muted">
                  <Image
                    src={d.image}
                    alt={d.title}
                    fill
                    quality={70}
                    className="object-cover object-[center_12%] transition duration-500 group-hover:scale-[1.04]"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">{d.label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-white">{d.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">New in woman</h2>
          <Link href="/products?gender=WOMEN&sort=newest" className="text-[11px] font-semibold uppercase tracking-[0.14em] underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={list} dense />
        </div>
      </div>
    </div>
  );
}
