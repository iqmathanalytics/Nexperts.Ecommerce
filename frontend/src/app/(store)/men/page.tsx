import Image from "next/image";
import Link from "next/link";
import { fetchPublicApi } from "@/lib/server-api";
import { ProductGrid } from "@/components/store/ProductCard";
import { CampaignHero } from "@/components/store/CampaignHero";
import { DEFAULT_EDITORIAL, MEN_HERO_VIDEO, MEN_TILES, mergeEditorial, type StorefrontEditorial } from "@/lib/editorial";
import { categoryHref, MEN_CATEGORY_NAV, withShopGender } from "@/lib/shop";
import type { ProductCard } from "@/lib/types";

export const revalidate = 300;

const MEN_NAV = MEN_CATEGORY_NAV.map((item) => ({
  href: categoryHref(item.slug, "MEN"),
  label: item.label,
}));

export default async function MenHubPage() {
  const [products, editorialRaw] = await Promise.all([
    fetchPublicApi<ProductCard[]>("/products?gender=MEN&sort=newest&limit=12", 300).catch(() => [] as ProductCard[]),
    fetchPublicApi<StorefrontEditorial>("/editorial", 300).catch(() => DEFAULT_EDITORIAL),
  ]);
  const list = Array.isArray(products) ? products : [];
  const editorial = mergeEditorial(editorialRaw);
  const tiles = MEN_TILES.map((l) => ({
    ...l,
    href: withShopGender(l.href, "MEN"),
  }));

  return (
    <div className="bg-background text-ink">
      <CampaignHero
        video={MEN_HERO_VIDEO}
        image={editorial.menHero}
        kicker="Man"
        title={editorial.menHeadline === "Man" ? "Essentials" : editorial.menHeadline}
        subtitle={editorial.menSubhead}
        actions={[{ href: "/products?gender=MEN", label: "Shop man", variant: "solid" }]}
        links={MEN_NAV}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {tiles.map((l) => (
            <Link key={l.href} href={l.href} className="group relative aspect-[3/4] overflow-hidden bg-surface-muted">
              <Image
                src={l.image}
                alt={l.label}
                fill
                quality={55}
                className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
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
