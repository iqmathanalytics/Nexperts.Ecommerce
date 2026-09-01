import { notFound } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

const views: Record<string, { title: string; description?: string }> = {
  collections: { title: "Collections", description: "Curate featured product collections for campaigns and storefront highlights." },
  attributes: { title: "Attributes", description: "Define product attributes such as size, color, and material for richer catalog data." },
};

export default async function CatalogViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = views[view];
  if (!config) notFound();
  return <AdminPlaceholder title={config.title} section="Catalog" description={config.description} />;
}
