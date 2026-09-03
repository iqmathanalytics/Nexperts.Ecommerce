"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  MessageSquareWarning,
  Package,
  PackageX,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/state";
import { formatINR } from "@/lib/utils";
import { AdminPage } from "@/components/admin/AdminTable";
import {
  ChartCard,
  DonutChart,
  GrowthChart,
  HorizontalBars,
  KpiCard,
  PERIOD_OPTIONS,
  RevenueOrdersChart,
} from "@/components/admin/charts";

type Dash = {
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    productsSold: number;
    aov: number;
    lowStock: number;
    outOfStock: number;
    pendingOrders: number;
    pendingReviews: number;
  };
  revenueOverTime: Array<{ day: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; units: number; revenue?: number }>;
  topCategories: Array<{ name: string; units: number }>;
  customerGrowth: Array<{ day: string; customers: number }>;
  ordersByStatus: Array<{ name: string; value: number }>;
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dash", period],
    queryFn: () => api<Dash>(`/admin/analytics/dashboard?period=${period}`),
  });
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "This period";

  return (
    <AdminPage
      title="Dashboard"
      description={`Store performance for ${periodLabel.toLowerCase()}.`}
      actions={
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40 bg-surface-raised">
          {PERIOD_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <p className="rounded-2xl border border-line bg-surface-raised p-6 text-sm text-muted">Unable to load dashboard metrics.</p>
      ) : (
        <DashboardBody data={data.data} periodLabel={periodLabel} />
      )}
    </AdminPage>
  );
}

function DashboardBody({ data, periodLabel }: { data: Dash; periodLabel: string }) {
  const k = data.kpis;
  return (
    <div className="space-y-5 pb-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Banknote} label="Revenue" value={formatINR(k.revenue)} hint={periodLabel} href="/admin/analytics" />
        <KpiCard icon={ShoppingBag} label="Orders" value={k.orders.toLocaleString("en-MY")} hint={periodLabel} href="/admin/orders" />
        <KpiCard icon={TrendingUp} label="Average order" value={formatINR(k.aov)} hint={`${k.productsSold.toLocaleString("en-MY")} units sold`} />
        <KpiCard icon={Users} label="Customers" value={k.customers.toLocaleString("en-MY")} hint="Active customer accounts" href="/admin/customers" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={AlertTriangle}
          label="Pending orders"
          value={k.pendingOrders.toLocaleString("en-MY")}
          hint="Needs action"
          href="/admin/orders"
          tone={k.pendingOrders > 0 ? "warning" : "default"}
        />
        <KpiCard
          icon={Package}
          label="Low stock"
          value={k.lowStock.toLocaleString("en-MY")}
          hint="At or below reorder"
          href="/admin/inventory"
          tone={k.lowStock > 0 ? "warning" : "default"}
        />
        <KpiCard
          icon={PackageX}
          label="Out of stock"
          value={k.outOfStock.toLocaleString("en-MY")}
          hint="Unavailable SKUs"
          href="/admin/inventory"
          tone={k.outOfStock > 0 ? "danger" : "default"}
        />
        <KpiCard
          icon={MessageSquareWarning}
          label="Pending reviews"
          value={k.pendingReviews.toLocaleString("en-MY")}
          hint="Awaiting moderation"
          href="/admin/reviews"
          tone={k.pendingReviews > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Revenue and orders" hint="Revenue as area, orders as bars">
          <RevenueOrdersChart data={data.revenueOverTime} />
        </ChartCard>
        <ChartCard title="Orders by status" hint={periodLabel}>
          <DonutChart data={data.ordersByStatus} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top products" hint="Units sold">
          <HorizontalBars data={data.topProducts} />
        </ChartCard>
        <ChartCard title="Top categories" hint="Units sold">
          <HorizontalBars data={data.topCategories} color="#c4a056" />
        </ChartCard>
      </div>

      <ChartCard title="New customers" hint="Sign-ups over the selected period">
        <GrowthChart data={data.customerGrowth} />
      </ChartCard>
    </div>
  );
}
