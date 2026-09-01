import { notFound } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

const views: Record<string, { title: string; description?: string }> = {
  channels: { title: "Sales Channels", description: "Connect online store, marketplaces, and POS channels in one place." },
  pricing: { title: "Pricing", description: "Manage price lists, compare-at pricing, and bulk price updates." },
  offers: { title: "Offers", description: "Bundle products and configure buy-X-get-Y style promotions." },
};

export default async function SalesViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = views[view];
  if (!config) notFound();
  return <AdminPlaceholder title={config.title} section="Sales" description={config.description} />;
}
