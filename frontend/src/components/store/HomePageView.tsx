import Link from "next/link";
import { CampaignHero } from "@/components/store/CampaignHero";
import { CampaignTile } from "@/components/store/CampaignTile";
import { HomeBelowFold } from "@/components/store/HomeBelowFold";
import { PromoMarquee } from "@/components/store/PromoMarquee";
import { CAMPAIGNS, DRESS_EDITS, DEFAULT_EDITORIAL, HERO_VIDEO, mergeEditorial, type StorefrontEditorial } from "@/lib/editorial";
import { categoryHref, MEN_CATEGORY_NAV, WOMEN_CATEGORY_NAV } from "@/lib/shop";
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
  editorial?: Partial<StorefrontEditorial> | null;
};

const DESTINATIONS = [
  { city: "Complimentary shipping", note: "On orders over RM 999" },
  { city: "Personal styling", note: "By appointment" },
  { city: "Easy returns", note: "7-day window" },
  { city: "Member rewards", note: "Points on every order" },
  { city: "Worldwide delivery", note: "Tracked dispatch" },
];

export function HomePageView({ data }: { data: HomeData }) {
  const featured = data.featured ?? [];
  const lookbooks = data.lookbooks ?? [];
  const editorial = mergeEditorial(data.editorial);
  const campaigns = editorial.campaigns.length ? editorial.campaigns : CAMPAIGNS;
  const dressEdits = editorial.dressEdits.length ? editorial.dressEdits : DRESS_EDITS;
  const ticker = editorial.ticker.length ? editorial.ticker : DEFAULT_EDITORIAL.ticker;
  const promoCodes = editorial.promoCodes.length ? editorial.promoCodes : DEFAULT_EDITORIAL.promoCodes;

  return (
    <div className="bg-background text-ink">
      <CampaignHero
        videos={[HERO_VIDEO]}
        title={editorial.homeHeadline}
        subtitle={editorial.homeSubhead}
        actions={[
          { href: "/women", label: "Shop woman", variant: "solid" },
          { href: "/men", label: "Shop man", variant: "outline" },
        ]}
        links={[
          { href: categoryHref("dresses", "WOMEN"), label: "Dresses" },
          { href: "/products?sort=newest", label: "New in" },
          { href: "/sale", label: "Sale" },
        ]}
      />

      <PromoMarquee
        items={ticker}
        className="overflow-hidden border-y border-line bg-brand text-white"
      />

      <section className="grid gap-4 p-3 md:grid-cols-2 md:p-5">
        {campaigns.slice(0, 2).map((c) => (
          <CampaignTile key={c.href} href={c.href} image={c.image} label={c.label} title={c.title ?? c.label} cta={c.cta ?? "Shop"} tall />
        ))}
      </section>

      {campaigns[2] ? (
        <div className="px-3 pb-3 md:px-5">
          <CampaignTile href={campaigns[2].href} image={campaigns[2].image} label={campaigns[2].label} title={campaigns[2].title ?? campaigns[2].label} cta={campaigns[2].cta ?? "Shop"} />
        </div>
      ) : null}

      <PromoMarquee
        items={promoCodes}
        reverse
        className="overflow-hidden bg-accent text-ink"
        itemClassName="px-2"
      />

      <HomeBelowFold featured={featured} dressEdits={dressEdits} lookbooks={lookbooks} />

      <section className="border-y border-line bg-brand text-white">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 md:grid-cols-5 md:px-8">
          {DESTINATIONS.map((d) => (
            <div key={d.city}>
              <p className="font-display text-2xl font-semibold">{d.city}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/60">{d.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Shop by category</p>
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="font-display text-2xl font-semibold">Woman</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {WOMEN_CATEGORY_NAV.map((item) => (
                    <Link
                      key={`w-${item.slug}`}
                      href={categoryHref(item.slug, "WOMEN")}
                      className="btn-store btn-chip rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-[var(--btn-fill)] hover:border-[var(--btn-fill-border)] hover:text-[var(--btn-fill-text)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold">Man</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {MEN_CATEGORY_NAV.map((item) => (
                    <Link
                      key={`m-${item.slug}`}
                      href={categoryHref(item.slug, "MEN")}
                      className="btn-store btn-chip rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-[var(--btn-fill)] hover:border-[var(--btn-fill-border)] hover:text-[var(--btn-fill-text)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-5 md:grid-cols-3">
          {[
            { href: "/sale", title: "The sale room", text: "Selected pieces, reduced — still cut for climate." },
            { href: "/style-quiz", title: "Find your fit", text: "Five questions. A better size for tropical heat." },
            { href: "/account/loyalty", title: "House members", text: "Earn points on every order, redeem in MYR." },
          ].map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group rounded-[2rem] border border-line bg-surface px-8 py-12 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-36px_rgba(28,25,21,0.45)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{b.title}</p>
              <p className="mt-2 text-sm text-muted">{b.text}</p>
              <span className="mt-4 inline-block translate-y-1 text-[10px] uppercase tracking-[0.18em] text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
