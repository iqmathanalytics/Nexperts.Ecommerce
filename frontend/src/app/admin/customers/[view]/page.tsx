import { notFound } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

const views: Record<string, { title: string; description?: string }> = {
  groups: { title: "Customer Groups", description: "Organize customers into groups for pricing rules and targeted campaigns." },
  segments: { title: "Customer Segments", description: "Build dynamic segments based on purchase behavior and engagement." },
};

export default async function CustomerViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = views[view];
  if (!config) notFound();
  return <AdminPlaceholder title={config.title} section="Customers" description={config.description} />;
}
