import { notFound } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

const views: Record<string, { title: string; description?: string }> = {
  discounts: { title: "Discounts", description: "Configure automatic discounts beyond coupon codes." },
  campaigns: { title: "Campaigns", description: "Plan seasonal campaigns with banners, landing pages, and promo rules." },
  "gift-cards": { title: "Gift Cards", description: "Issue and redeem digital gift cards." },
  loyalty: { title: "Loyalty Program", description: "Reward repeat customers with points and tier benefits." },
  "abandoned-carts": { title: "Abandoned Carts", description: "Recover lost sales with abandoned cart reminders and offers." },
};

export default async function MarketingViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = views[view];
  if (!config) notFound();
  return <AdminPlaceholder title={config.title} section="Marketing" description={config.description} />;
}
