import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { OrdersList } from "@/components/admin/OrdersList";

const orderViews: Record<string, { title: string; status?: string; placeholder?: boolean }> = {
  pending: { title: "Pending Orders", status: "PENDING" },
  confirmed: { title: "Confirmed", status: "CONFIRMED" },
  processing: { title: "Processing", status: "PROCESSING" },
  packed: { title: "Packed", status: "PACKED" },
  shipped: { title: "Shipped", status: "SHIPPED" },
  delivered: { title: "Delivered", status: "DELIVERED" },
  cancellations: { title: "Cancellations", status: "CANCELLED" },
  returns: { title: "Returns & Refunds", placeholder: true },
};

export default async function OrderViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const config = orderViews[view];
  if (!config) notFound();

  if (config.placeholder) {
    return (
      <AdminPlaceholder
        title={config.title}
        section="Orders"
        description="Returns and refund workflows will be managed here in a future release."
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <OrdersList title={config.title} defaultStatus={config.status} />
    </Suspense>
  );
}
