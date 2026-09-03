import { Suspense } from "react";
import { fetchPublicApi } from "@/lib/server-api";
import { HomePageView, type HomeData } from "@/components/store/HomePageView";
import { CampaignHero } from "@/components/store/CampaignHero";
import { PageState } from "@/components/ui/state";
import { DEFAULT_EDITORIAL, HERO_VIDEO } from "@/lib/editorial";
import type { ProductCard } from "@/lib/types";

export const revalidate = 300;

function HomeFallback() {
  return (
    <CampaignHero
      video={HERO_VIDEO}
      title={DEFAULT_EDITORIAL.homeHeadline}
      subtitle={DEFAULT_EDITORIAL.homeSubhead}
      actions={[
        { href: "/women", label: "Shop woman", variant: "solid" },
        { href: "/men", label: "Shop man", variant: "outline" },
      ]}
    />
  );
}

async function HomeLoaded() {
  try {
    const home = await fetchPublicApi<HomeData>("/home", 300);
    const featured = Array.isArray(home.featured) ? home.featured : ([] as ProductCard[]);
    return (
      <HomePageView
        data={{
          ...home,
          featured,
          lookbooks: home.lookbooks ?? [],
        }}
      />
    );
  } catch {
    return (
      <PageState title="Unable to load the store">
        Please start the API and try again.
      </PageState>
    );
  }
}

export default function HomePage() {
  return (
    <>
      <link rel="preload" as="image" href={HERO_VIDEO.poster} fetchPriority="high" />
      <Suspense fallback={<HomeFallback />}>
        <HomeLoaded />
      </Suspense>
    </>
  );
}
