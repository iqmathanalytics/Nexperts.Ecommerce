"use client";

import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Package, ShoppingBag, TrendingDown } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Select } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { Spinner } from "@/components/ui/state";
import {
  ChartCard,
  DonutChart,
  HorizontalBars,
  KpiCard,
  PERIOD_OPTIONS,
  RevenueOrdersChart,
} from "@/components/admin/charts";

const titles: Record<string, string> = {
  sales: "Sales Analytics",
  products: "Product Analytics",
  customers: "Customer Analytics",
  inventory: "Inventory Analytics",
};

type Dash = {
  revenueOverTime: Array<{ day: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; units: number }>;
  ordersByStatus: Array<{ name: string; value: number }>;
};

type Sales = {
  grossRevenue: number;
  netRevenue: number;
  orders: number;
  unitsSold: number;
  discounts: number;
  refunds: number;
  aov: number;
};

type Inventory = {
  totalStock: number;
  healthyStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  bestSelling: Array<{ name: string; units: number }>;
  slowMoving: Array<{ name: string; units: number }>;
};

export default function AnalyticsViewPage() {
  const { view } = useParams<{ view: string }>();
  const title = titles[view];
  if (!title) notFound();

  if (view === "products" || view === "customers") {
    return (
      <AdminPlaceholder
        title={title}
        section="Analytics"
        description={`${title} dashboards with cohort and funnel views are planned for a later phase.`}
      />
    );
  }

  if (view === "sales") return <SalesAnalytics title={title} />;
  if (view === "inventory") return <InventoryAnalytics title={title} />;
  notFound();
}

function SalesAnalytics({ title }: { title: string }) {
  const [period, setPeriod] = useState("30d");
  const sales = useQuery({ queryKey: ["sales", period], queryFn: () => api<Sales>(`/admin/analytics/sales?period=${period}`) });
  const dash = useQuery({
    queryKey: ["dash", period],
    queryFn: () => api<Dash>(`/admin/analytics/dashboard?period=${period}`),
  });
  const s = sales.data?.data;
  const d = dash.data?.data;
  if (sales.isLoading || dash.isLoading) return <Spinner />;
  return (
    <div className="space-y-5 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
          {PERIOD_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={IndianRupee} label="Gross revenue" value={formatINR(s?.grossRevenue ?? 0)} />
        <KpiCard icon={IndianRupee} label="Net revenue" value={formatINR(s?.netRevenue ?? 0)} />
        <KpiCard icon={ShoppingBag} label="Orders" value={(s?.orders ?? 0).toLocaleString("en-IN")} hint={`AOV ${formatINR(s?.aov ?? 0)}`} />
        <KpiCard icon={TrendingDown} label="Discounts" value={formatINR(s?.discounts ?? 0)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Revenue and orders">
          <RevenueOrdersChart data={d?.revenueOverTime ?? []} />
        </ChartCard>
        <ChartCard title="Orders by status">
          <DonutChart data={d?.ordersByStatus ?? []} />
        </ChartCard>
      </div>
      <ChartCard title="Top products">
        <HorizontalBars data={d?.topProducts ?? []} />
      </ChartCard>
    </div>
  );
}

function InventoryAnalytics({ title }: { title: string }) {
  const inv = useQuery({ queryKey: ["inv-an"], queryFn: () => api<Inventory>("/admin/inventory/analytics") });
  const i = inv.data?.data;
  if (inv.isLoading) return <Spinner />;
  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Package} label="Inventory value" value={formatINR(i?.inventoryValue ?? 0)} />
        <KpiCard icon={Package} label="Total units" value={(i?.totalStock ?? 0).toLocaleString("en-IN")} />
        <KpiCard icon={Package} label="Low stock" value={(i?.lowStock ?? 0).toLocaleString("en-IN")} tone={(i?.lowStock ?? 0) > 0 ? "warning" : "default"} />
        <KpiCard icon={Package} label="Out of stock" value={(i?.outOfStock ?? 0).toLocaleString("en-IN")} tone={(i?.outOfStock ?? 0) > 0 ? "danger" : "default"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="SKU status">
          <DonutChart
            data={[
              { name: "Healthy", value: i?.healthyStock ?? 0 },
              { name: "Low stock", value: i?.lowStock ?? 0 },
              { name: "Out of stock", value: i?.outOfStock ?? 0 },
            ]}
          />
        </ChartCard>
        <ChartCard title="Best sellers">
          <HorizontalBars data={i?.bestSelling ?? []} />
        </ChartCard>
        <ChartCard title="Slow moving">
          <HorizontalBars data={i?.slowMoving ?? []} color="#64748b" />
        </ChartCard>
      </div>
    </div>
  );
}
