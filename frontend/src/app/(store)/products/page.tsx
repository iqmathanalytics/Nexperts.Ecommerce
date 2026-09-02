"use client";

import { Suspense } from "react";
import { CatalogInner } from "@/components/store/Catalog";
import { CampaignHero } from "@/components/store/CampaignHero";
import { Spinner } from "@/components/ui/state";
import { NEW_HERO, NEW_HERO_VIDEO } from "@/lib/editorial";
import { categoryHref } from "@/lib/shop";

export default function ProductsPage() {
  return (
    <>
      <CampaignHero
        video={NEW_HERO_VIDEO}
        image={NEW_HERO}
        kicker="New in"
        title={"This week’s\nsilhouettes"}
        subtitle="The latest pieces for Woman and Man — just dropped, cut for warm climates."
        actions={[
          { href: "/products?gender=WOMEN&sort=newest", label: "Shop woman", variant: "solid" },
          { href: "/products?gender=MEN&sort=newest", label: "Shop man", variant: "outline" },
        ]}
        links={[
          { href: categoryHref("dresses", "WOMEN"), label: "Dresses" },
          { href: categoryHref("tops", "MEN"), label: "Shirts" },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        }
      >
        <CatalogInner hideHeading />
      </Suspense>
    </>
  );
}
