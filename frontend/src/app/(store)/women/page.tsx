import Image from "next/image";
import Link from "next/link";
import { fetchPublicApi } from "@/lib/server-api";
import { ProductGrid } from "@/components/store/ProductCard";
import { CampaignHero } from "@/components/store/CampaignHero";
import { Reveal } from "@/components/store/Reveal";
import { DRESS_EDITS, DEFAULT_EDITORIAL, WOMEN_HERO_VIDEO, mergeEditorial, type StorefrontEditorial } from "@/lib/editorial";
import { categoryHref, WOMEN_CATEGORY_NAV, withShopGender } from "@/lib/shop";
import type { ProductCard } from "@/lib/types";

export const revalidate = 300;

const WOMEN_NAV = [
  ...WOMEN_CATEGORY_NAV.map((item) => ({ href: categoryHref(item.slug, "WOMEN"), label: item.label })),
  { href: "/products?gender=WOMEN&sort=newest", label: "New in" },
];

export default async function WomenHubPage() {
  const [products, editorialRaw] = await Promise.all([
    fetchPublicApi<ProductCard[]>("/products?gender=WOMEN&sort=newest&limit=12", 300).catch(() => [] as ProductCard[]),
    fetchPublicApi<StorefrontEditorial>("/editorial", 300).catch(() => DEFAULT_EDITORIAL),
  ]);
  const list = Array.isArray(products) ? products : [];
  const editorial = mergeEditorial(editorialRaw);
  const dressEdits = (editorial.dressEdits.length ? editorial.dressEdits : DRESS_EDITS).map((d) => ({
    ...d,
    href: withShopGender(d.href, "WOMEN"),
  }));

  return (
    <div className="bg-background text-ink">
      <CampaignHero
        video={WOMEN_HERO_VIDEO}
        image={editorial.womenHero}
        kicker="Woman"
        title={editorial.womenHeadline === "Woman" ? "New season" : editorial.womenHeadline}
        subtitle={editorial.womenSubhead}
        actions={[{ href: "/products?gender=WOMEN", label: "Shop woman", variant: "solid" }]}
        links={WOMEN_NAV}
      />

      <Reveal>
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">The collection</p>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Occasion, length, drape</h2>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {dressEdits.map((d) => (
              <Link key={d.href} href={d.href} className="group relative aspect-[3/4] overflow-hidden bg-surface-muted">
                <Image
                  src={d.image}
                  alt={d.title ?? d.label}
                  fill
                  quality={55}
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                  sizes="33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">{d.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-white">{d.title ?? d.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
        <div className="flex items-end justify-between">
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
