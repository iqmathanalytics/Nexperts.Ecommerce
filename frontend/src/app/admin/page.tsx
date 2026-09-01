"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  IndianRupee,
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
    <div className="space-y-5 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Store performance for {periodLabel.toLowerCase()}.</p>
        </div>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
          {PERIOD_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <p className="rounded-xl bg-white p-6 text-sm text-slate-600">Unable to load dashboard metrics.</p>
      ) : (
        <DashboardBody data={data.data} periodLabel={periodLabel} />
      )}
    </div>
  );
}

function DashboardBody({ data, periodLabel }: { data: Dash; periodLabel: string }) {
  const k = data.kpis;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={IndianRupee} label="Revenue" value={formatINR(k.revenue)} hint={periodLabel} href="/admin/analytics" />
        <KpiCard icon={ShoppingBag} label="Orders" value={k.orders.toLocaleString("en-IN")} hint={periodLabel} href="/admin/orders" />
        <KpiCard icon={TrendingUp} label="Average order" value={formatINR(k.aov)} hint={`${k.productsSold.toLocaleString("en-IN")} units sold`} />
        <KpiCard icon={Users} label="Customers" value={k.customers.toLocaleString("en-IN")} hint="Active accounts" href="/admin/customers" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={AlertTriangle}
          label="Pending orders"
          value={k.pendingOrders.toLocaleString("en-IN")}
          hint="Needs action"
          href="/admin/orders"
          tone={k.pendingOrders > 0 ? "warning" : "default"}
        />
        <KpiCard
          icon={Package}
          label="Low stock"
          value={k.lowStock.toLocaleString("en-IN")}
          hint="At or below reorder"
          href="/admin/inventory"
          tone={k.lowStock > 0 ? "warning" : "default"}
        />
        <KpiCard
          icon={PackageX}
          label="Out of stock"
          value={k.outOfStock.toLocaleString("en-IN")}
          hint="Unavailable SKUs"
          href="/admin/inventory"
          tone={k.outOfStock > 0 ? "danger" : "default"}
        />
        <KpiCard
          icon={MessageSquareWarning}
          label="Pending reviews"
          value={k.pendingReviews.toLocaleString("en-IN")}
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
          <HorizontalBars data={data.topCategories} color="#d9a600" />
        </ChartCard>
      </div>

      <ChartCard title="New customers" hint="Sign-ups over the selected period">
        <GrowthChart data={data.customerGrowth} />
      </ChartCard>
    </>
  );
}
