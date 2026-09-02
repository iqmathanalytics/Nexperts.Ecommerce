import Image from "next/image";
import Link from "next/link";
import { fetchPublicApi } from "@/lib/server-api";
import { ProductGrid } from "@/components/store/ProductCard";
import { MEN_HERO, MEN_TILES } from "@/lib/editorial";
import type { ProductCard } from "@/lib/types";

export const revalidate = 120;

export default async function MenHubPage() {
  const products = await fetchPublicApi<ProductCard[]>("/products?gender=MEN&sort=newest&limit=12", 120).catch(
    () => [] as ProductCard[],
  );
  const list = Array.isArray(products) ? products : [];

  return (
    <div className="bg-white text-ink">
      <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-surface-muted md:min-h-[78vh]">
        <Image src={MEN_HERO} alt="Man" fill priority quality={60} className="object-cover object-[center_18%]" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-12 md:px-8">
          <p className="nexperts-mark animate-rise text-[10px] text-white/80">Nexperts</p>
          <h1 className="animate-rise-delay-1 mt-2 font-display text-5xl font-semibold text-white md:text-7xl">Man</h1>
          <p className="animate-rise-delay-2 mt-3 max-w-md text-sm text-white/80">
            Tailored essentials, knits, and seasonal layers.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {MEN_TILES.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:border-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {MEN_TILES.map((l) => (
            <Link key={l.href} href={l.href} className="group relative aspect-[3/4] overflow-hidden bg-surface-muted">
              <Image
                src={l.image}
                alt={l.label}
                fill
                quality={70}
                className="object-cover object-[center_12%] transition duration-500 group-hover:scale-[1.04]"
                sizes="25vw"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">New in man</h2>
          <Link href="/products?gender=MEN&sort=newest" className="text-[11px] font-semibold uppercase tracking-[0.14em] underline-offset-4 hover:underline">
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
