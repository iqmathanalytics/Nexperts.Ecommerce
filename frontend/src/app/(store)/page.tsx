import { fetchPublicApi } from "@/lib/server-api";
import { HomePageView, type HomeData } from "@/components/store/HomePageView";
import { PageState } from "@/components/ui/state";
import type { ProductCard } from "@/lib/types";

export const revalidate = 120;

export default async function HomePage() {
  try {
    const home = await fetchPublicApi<HomeData>("/home", 120);
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
