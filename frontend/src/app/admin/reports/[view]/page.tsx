"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { Spinner } from "@/components/ui/state";

const titles: Record<string, string> = {
  sales: "Sales Reports",
  inventory: "Inventory Reports",
  customers: "Customer Reports",
  financial: "Financial Reports",
};

export default function ReportsViewPage() {
  const { view } = useParams<{ view: string }>();
  const title = titles[view];
  if (!title) notFound();

  if (view === "customers" || view === "financial") {
    return (
      <AdminPlaceholder
        title={title}
        section="Reports"
        description={`${title} exports and scheduled delivery will be available in a future release.`}
      />
    );
  }

  if (view === "sales") return <SalesReport title={title} />;
  if (view === "inventory") return <InventoryReport title={title} />;
  notFound();
}

function SalesReport({ title }: { title: string }) {
  const sales = useQuery({ queryKey: ["sales", "30d"], queryFn: () => api<any>("/admin/analytics/sales?period=30d") });
  if (sales.isLoading) return <Spinner />;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      <section className="rounded-xl bg-white p-5">
        <h2 className="font-medium">30-day sales summary</h2>
        <pre className="mt-3 overflow-auto text-sm">{JSON.stringify(sales.data?.data, null, 2)}</pre>
      </section>
    </div>
  );
}

function InventoryReport({ title }: { title: string }) {
  const inv = useQuery({ queryKey: ["inv-an"], queryFn: () => api<any>("/admin/inventory/analytics") });
  if (inv.isLoading) return <Spinner />;
  const i = inv.data?.data;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      <section className="rounded-xl bg-white p-5">
        <h2 className="font-medium">Inventory snapshot</h2>
        <p className="mt-2 text-sm">Value {formatINR(i?.inventoryValue ?? 0)}</p>
        <p className="text-sm">Best sellers: {(i?.bestSelling ?? []).map((p: { name: string }) => p.name).join(", ") || "—"}</p>
        <p className="text-sm">Slow moving: {(i?.slowMoving ?? []).map((p: { name: string }) => p.name).join(", ") || "—"}</p>
      </section>
    </div>
  );
}
