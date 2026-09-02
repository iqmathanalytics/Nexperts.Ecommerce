"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Package, ShoppingBag, TrendingDown } from "lucide-react";
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
  kpis: { revenue: number; orders: number; aov: number; productsSold: number };
  revenueOverTime: Array<{ day: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; units: number }>;
  topCategories: Array<{ name: string; units: number }>;
  customerGrowth: Array<{ day: string; customers: number }>;
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const dash = useQuery({
    queryKey: ["dash", period],
    queryFn: () => api<Dash>(`/admin/analytics/dashboard?period=${period}`),
  });
  const sales = useQuery({
    queryKey: ["sales", period],
    queryFn: () => api<Sales>(`/admin/analytics/sales?period=${period}`),
  });
  const inv = useQuery({
    queryKey: ["inv-an"],
    queryFn: () => api<Inventory>("/admin/inventory/analytics"),
  });
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "This period";
  const d = dash.data?.data;
  const s = sales.data?.data;
  const i = inv.data?.data;
  const loading = dash.isLoading || sales.isLoading || inv.isLoading;

  return (
    <AdminPage
      title="Analytics"
      description={`Sales, customers, and inventory for ${periodLabel.toLowerCase()}.`}
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
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Banknote} label="Gross revenue" value={formatINR(s?.grossRevenue ?? 0)} hint={periodLabel} />
            <KpiCard icon={Banknote} label="Net revenue" value={formatINR(s?.netRevenue ?? 0)} hint="After SST" />
            <KpiCard icon={ShoppingBag} label="Units sold" value={(s?.unitsSold ?? 0).toLocaleString("en-MY")} />
            <KpiCard icon={TrendingDown} label="Discounts" value={formatINR(s?.discounts ?? 0)} hint={`Refunds ${formatINR(s?.refunds ?? 0)}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard className="xl:col-span-2" title="Revenue and orders" hint={periodLabel}>
              <RevenueOrdersChart data={d?.revenueOverTime ?? []} />
            </ChartCard>
            <ChartCard title="Orders by status">
              <DonutChart data={d?.ordersByStatus ?? []} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top products">
              <HorizontalBars data={d?.topProducts ?? []} />
            </ChartCard>
            <ChartCard title="New customers">
              <GrowthChart data={d?.customerGrowth ?? []} />
            </ChartCard>
          </div>

          <h2 className="pt-2 font-display text-lg font-semibold">Inventory health</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Package} label="Inventory value" value={formatINR(i?.inventoryValue ?? 0)} />
            <KpiCard icon={Package} label="Total units" value={(i?.totalStock ?? 0).toLocaleString("en-MY")} />
            <KpiCard icon={Package} label="Low stock SKUs" value={(i?.lowStock ?? 0).toLocaleString("en-MY")} tone={(i?.lowStock ?? 0) > 0 ? "warning" : "default"} />
            <KpiCard icon={Package} label="Out of stock" value={(i?.outOfStock ?? 0).toLocaleString("en-MY")} tone={(i?.outOfStock ?? 0) > 0 ? "danger" : "default"} />
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
            <ChartCard title="Best sellers" hint="All-time units">
              <HorizontalBars data={i?.bestSelling ?? []} />
            </ChartCard>
            <ChartCard title="Slow moving" hint="In stock, no sales">
              <HorizontalBars data={i?.slowMoving ?? []} color="#6e675c" />
            </ChartCard>
          </div>

          <PremiumAnalyticsBlock />
        </div>
      )}
    </AdminPage>
  );
}

function PremiumAnalyticsBlock() {
  const premium = useQuery({
    queryKey: ["premium-analytics"],
    queryFn: () =>
      api<{
        revenueByBrand: Array<{ brand: string; revenue: string | number }>;
        mostWishlisted: Array<{ name: string; wishes: number }>;
        fitTrends: Array<{ productId: number; smallCount: number; trueCount: number; largeCount: number }>;
        funnel: Array<{ event_type: string; c: number }>;
      }>("/admin/analytics/premium"),
    retry: false,
  });
  const p = premium.data?.data;
  if (premium.isError || !p) return null;
  return (
    <div className="space-y-4 pt-4">
      <h2 className="font-display text-lg font-semibold">Premium insights</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue by designer">
          <HorizontalBars
            data={(p.revenueByBrand ?? []).map((r) => ({
              name: r.brand || "Unbranded",
              units: Math.round(Number(r.revenue) || 0),
            }))}
          />
        </ChartCard>
        <ChartCard title="Most wishlisted">
          <HorizontalBars
            data={(p.mostWishlisted ?? []).map((r) => ({ name: r.name, units: Number(r.wishes) || 0 }))}
          />
        </ChartCard>
      </div>
      <ChartCard title="Fit feedback trends">
        <div className="space-y-2 text-sm">
          {(p.fitTrends ?? []).slice(0, 8).map((f) => (
            <div key={f.productId} className="flex justify-between border-b border-line py-2">
              <span>Product #{f.productId}</span>
              <span className="text-muted">
                S {f.smallCount} · T {f.trueCount} · L {f.largeCount}
              </span>
            </div>
          ))}
          {!p.fitTrends?.length ? <p className="text-muted">No fit data yet.</p> : null}
        </div>
      </ChartCard>
    </div>
  );
}
