import { notFound } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

const views: Record<string, { title: string; description?: string }> = {
  warehouses: { title: "Warehouses", description: "Manage warehouse locations and stock allocation across fulfillment centers." },
  "stock-transfers": { title: "Stock Transfers", description: "Move inventory between warehouses with full transfer history." },
  "purchase-orders": { title: "Purchase Orders", description: "Create and track purchase orders from suppliers." },
  suppliers: { title: "Suppliers", description: "Maintain supplier profiles, contacts, and lead times." },
  "stock-adjustments": { title: "Stock Adjustments", description: "Record manual stock corrections for damage, shrinkage, or audits." },
};

export default async function InventoryViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = views[view];
  if (!config) notFound();
  return <AdminPlaceholder title={config.title} section="Inventory" description={config.description} />;
}
