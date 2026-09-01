import { fetchPublicApi } from "@/lib/server-api";
import { HomePageView, type HomeData } from "@/components/store/HomePageView";
import { PageState } from "@/components/ui/state";

export const revalidate = 60;

export default async function HomePage() {
  try {
    const data = await fetchPublicApi<HomeData>("/home", 60);
    return <HomePageView data={data} />;
  } catch {
    return (
      <PageState title="Unable to load the store">
        Please start the API and try again.
      </PageState>
    );
  }
}
