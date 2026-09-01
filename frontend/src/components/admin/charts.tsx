"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn, formatCompactINR, formatCompactNumber, formatINR } from "@/lib/utils";

export const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "year", label: "This year" },
];

export const CHART = {
  revenue: "#0f766e",
  orders: "#d9a600",
  customers: "#1e293b",
  grid: "#e2e8f0",
  tick: "#64748b",
  donut: ["#0f766e", "#d9a600", "#1e293b", "#f59e0b", "#64748b", "#b45309", "#0ea5e9"],
};

export function formatChartDay(value: unknown) {
  const s = String(value ?? "");
  const d = new Date(/^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(0, 10)}T00:00:00` : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ChartCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div className="min-h-[240px] flex-1">{children}</div>
    </section>
  );
}

export function ChartEmpty({ label = "No data in this period" }: { label?: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-slate-500">{label}</div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger";
}) {
  const body = (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm transition",
        tone === "danger" && "border-red-100 bg-red-50",
        tone === "warning" && "border-amber-100 bg-amber-50",
        tone === "default" && "border-slate-200 bg-white",
        href && "hover:border-slate-300 hover:shadow",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "rounded-md p-1.5",
              tone === "danger" && "bg-red-100 text-red-700",
              tone === "warning" && "bg-amber-100 text-amber-800",
              tone === "default" && "bg-slate-100 text-slate-700",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function ChartTooltip({
  active,
  payload,
  label,
  moneyKeys = ["revenue"],
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
  moneyKeys?: string[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-slate-800">{formatChartDay(label)}</p>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "");
        const value = Number(item.value ?? 0);
        return (
          <p key={key} className="text-slate-600" style={{ color: item.color }}>
            {item.name}: {moneyKeys.includes(key) ? formatINR(value) : value.toLocaleString("en-IN")}
          </p>
        );
      })}
    </div>
  );
}

const axis = {
  tick: { fontSize: 11, fill: CHART.tick },
  line: { stroke: CHART.grid },
};

export function RevenueOrdersChart({ data }: { data: Array<{ day: string; revenue: number; orders: number }> }) {
  const hasData = data.some((d) => d.revenue > 0 || d.orders > 0);
  if (!hasData) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.revenue} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART.revenue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickFormatter={formatChartDay} tick={axis.tick} tickLine={false} axisLine={axis.line} minTickGap={28} />
        <YAxis yAxisId="left" tickFormatter={formatCompactINR} tick={axis.tick} tickLine={false} axisLine={false} width={56} />
        <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={axis.tick} tickLine={false} axisLine={false} width={32} />
        <Tooltip content={<ChartTooltip moneyKeys={["revenue"]} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={CHART.revenue}
          fill="url(#revFill)"
          strokeWidth={2}
        />
        <Bar yAxisId="right" dataKey="orders" name="Orders" fill={CHART.orders} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function GrowthChart({ data }: { data: Array<{ day: string; customers: number }> }) {
  const hasData = data.some((d) => d.customers > 0);
  if (!hasData) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="custFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.customers} stopOpacity={0.22} />
            <stop offset="100%" stopColor={CHART.customers} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickFormatter={formatChartDay} tick={axis.tick} tickLine={false} axisLine={axis.line} minTickGap={28} />
        <YAxis allowDecimals={false} tick={axis.tick} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<ChartTooltip moneyKeys={[]} />} />
        <Area type="monotone" dataKey="customers" name="New customers" stroke={CHART.customers} fill="url(#custFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({
  data,
  valueKey = "units",
  valueIsMoney,
  color = CHART.revenue,
}: {
  data: Array<{ name: string; units?: number; revenue?: number; value?: number }>;
  valueKey?: "units" | "revenue" | "value";
  valueIsMoney?: boolean;
  color?: string;
}) {
  const rows = data.filter((d) => Number(d[valueKey] ?? 0) > 0);
  if (!rows.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, rows.length * 36)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={valueIsMoney ? formatCompactINR : formatCompactNumber}
          tick={axis.tick}
          tickLine={false}
          axisLine={axis.line}
        />
        <YAxis type="category" dataKey="name" width={118} tick={axis.tick} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => (valueIsMoney ? formatINR(Number(value)) : Number(value).toLocaleString("en-IN"))}
        />
        <Bar dataKey={valueKey} fill={color} radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3} stroke="#fff" strokeWidth={2}>
          {rows.map((row, i) => (
            <Cell key={row.name} fill={CHART.donut[i % CHART.donut.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => Number(value).toLocaleString("en-IN")} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
