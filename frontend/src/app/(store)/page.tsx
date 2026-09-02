import { fetchPublicApi } from "@/lib/server-api";
import { HomePageView, type HomeData } from "@/components/store/HomePageView";
import { PageState } from "@/components/ui/state";
import { HERO_VIDEO } from "@/lib/editorial";
import type { ProductCard } from "@/lib/types";

export const revalidate = 300;

export default async function HomePage() {
  try {
    const home = await fetchPublicApi<HomeData>("/home", 300);
    const featured = Array.isArray(home.featured) ? home.featured : ([] as ProductCard[]);
    return (
      <>
        {/* Poster only — browsers reject link preload as="video". */}
        <link rel="preconnect" href="https://assets.mixkit.co" />
        <link rel="preload" as="image" href={HERO_VIDEO.poster} fetchPriority="high" />
        <HomePageView
          data={{
            ...home,
            featured,
            lookbooks: home.lookbooks ?? [],
          }}
        />
      </>
    );
  } catch {
    return (
      <PageState title="Unable to load the store">
        Please start the API and try again.
      </PageState>
    );
  }
}
