"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn, formatCompactNumber, formatDateTime, formatMoney } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPage, AdminTableModal, DataTable, FilterBar, FormError, type DataColumn } from "@/components/admin/AdminTable";

type Row = {
  variantId: number;
  sku: string;
  productName: string;
  variantName?: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  price?: number | string;
  value?: number;
};

type Tx = {
  id: number;
  variantId: number;
  sku: string;
  productName: string;
  previousStock: number;
  newStock: number;
  difference: number;
  reason: string;
  notes: string | null;
  createdAt: string;
};

const ADJUST_REASONS = [
  { value: "MANUAL_ADJUSTMENT", label: "Manual adjustment" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "DAMAGE", label: "Damage" },
  { value: "RETURN", label: "Return" },
  { value: "CORRECTION", label: "Correction" },
];

const TX_REASONS = [
  ...ADJUST_REASONS,
  { value: "SALE", label: "Sale" },
  { value: "RESERVE", label: "Reserve" },
  { value: "RELEASE", label: "Release" },
];

function reasonLabel(code: string) {
  return TX_REASONS.find((r) => r.value === code)?.label ?? code.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "good";
  onClick?: () => void;
}) {
  const className = cn(
    "rounded-xl border p-4 text-left",
    tone === "danger" && "border-red-200 bg-red-50",
    tone === "warning" && "border-amber-200 bg-amber-50",
    tone === "good" && "border-brand/25 bg-brand-soft",
    tone === "default" && "border-line bg-surface",
    onClick && "transition hover:border-brand",
  );
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [reason, setReason] = useState("MANUAL_ADJUSTMENT");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<number, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [tableView, setTableView] = useState<"stock" | "transactions" | null>(null);

  const [txQ, setTxQ] = useState("");
  const dTxQ = useDebouncedValue(txQ, 300);
  const [txReason, setTxReason] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");

  const stock = useQuery({
    queryKey: ["inv", filter, dq],
    queryFn: () => api<Row[]>(`/admin/inventory?filter=${filter}&q=${encodeURIComponent(dq)}`),
  });
  const stockAll = useQuery({
    queryKey: ["inv", "all", ""],
    queryFn: () => api<Row[]>("/admin/inventory?filter=all"),
  });
  const txs = useQuery({
    queryKey: ["inv-tx", selectedVariant, dTxQ, txReason, txFrom, txTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedVariant) params.set("variantId", String(selectedVariant));
      if (dTxQ) params.set("q", dTxQ);
      if (txReason) params.set("reason", txReason);
      if (txFrom) params.set("from", txFrom);
      if (txTo) params.set("to", txTo);
      const qs = params.toString();
      return api<Tx[]>(`/admin/inventory/transactions${qs ? `?${qs}` : ""}`);
    },
  });
  const txAll = useQuery({
    queryKey: ["inv-tx", "metrics"],
    queryFn: () => api<Tx[]>("/admin/inventory/transactions"),
  });

  const adjust = useMutation({
    mutationFn: (row: Row) => {
      const quantity = Number(qty[row.variantId] ?? 0);
      if (!quantity) throw new Error("Enter a plus or minus quantity first.");
      return api("/admin/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          variantId: row.variantId,
          quantity,
          reason,
          notes: notes.trim() || undefined,
        }),
      });
    },
    onSuccess: (_data, row) => {
      setQty((prev) => ({ ...prev, [row.variantId]: "" }));
      qc.invalidateQueries({ queryKey: ["inv"] });
      qc.invalidateQueries({ queryKey: ["inv-tx"] });
    },
  });

  const allRows = stockAll.data?.data ?? [];
  const rows = stock.data?.data ?? [];
  const allTxs = txAll.data?.data ?? [];
  const txRows = txs.data?.data ?? [];
  const selectedSku =
    allRows.find((r) => r.variantId === selectedVariant)?.sku ??
    rows.find((r) => r.variantId === selectedVariant)?.sku;

  const stockMetrics = useMemo(() => {
    const skuCount = allRows.length;
    const unitsOnHand = allRows.reduce((sum, row) => sum + Number(row.stock ?? 0), 0);
    const reserved = allRows.reduce((sum, row) => sum + Number(row.reservedStock ?? 0), 0);
    const available = allRows.reduce((sum, row) => sum + Math.max(0, Number(row.availableStock ?? 0)), 0);
    const lowStock = allRows.filter((row) => Number(row.availableStock) > 0 && Number(row.availableStock) <= Number(row.reorderLevel)).length;
    const outOfStock = allRows.filter((row) => Number(row.availableStock) <= 0).length;
    const value = allRows.reduce((sum, row) => {
      const priced = Number(row.value);
      if (!Number.isNaN(priced) && priced > 0) return sum + priced;
      return sum + Math.max(0, Number(row.availableStock ?? 0)) * Number(row.price ?? 0);
    }, 0);
    return { skuCount, unitsOnHand, reserved, available, lowStock, outOfStock, value };
  }, [allRows]);

  const txMetrics = useMemo(() => {
    const movements = allTxs.length;
    const unitsIn = allTxs.reduce((sum, tx) => sum + (tx.difference > 0 ? tx.difference : 0), 0);
    const unitsOut = allTxs.reduce((sum, tx) => sum + (tx.difference < 0 ? Math.abs(tx.difference) : 0), 0);
    const net = unitsIn - unitsOut;
    const skus = new Set(allTxs.map((tx) => tx.variantId)).size;
    const latest = allTxs[0]?.createdAt;
    const reasons = TX_REASONS.map((item) => ({
      ...item,
      count: allTxs.filter((tx) => tx.reason === item.value).length,
    })).filter((item) => item.count > 0);
    return { movements, unitsIn, unitsOut, net, skus, latest, reasons };
  }, [allTxs]);

  const stockColumns: DataColumn<Row>[] = [
    {
      id: "product",
      header: "Product",
      cell: (r) => (
        <span>
          {r.productName}
          {r.variantName ? <span className="mt-0.5 block text-[11px] text-muted">{r.variantName}</span> : null}
        </span>
      ),
    },
    { id: "sku", header: "SKU", cell: (r) => r.sku },
    { id: "stock", header: "On hand", cell: (r) => Number(r.stock) },
    { id: "reserved", header: "Reserved", cell: (r) => Number(r.reservedStock) },
    { id: "available", header: "Available", cell: (r) => Number(r.availableStock) },
    {
      id: "value",
      header: "Value",
      cell: (r) => formatMoney(Number(r.value ?? Math.max(0, Number(r.availableStock)) * Number(r.price ?? 0))),
    },
    { id: "reorder", header: "Reorder at", cell: (r) => Number(r.reorderLevel) },
    {
      id: "adjust",
      header: "Adjust",
      cell: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Input
            className="h-8 w-20"
            type="number"
            placeholder="+ / −"
            value={qty[r.variantId] ?? ""}
            onChange={(e) => setQty({ ...qty, [r.variantId]: e.target.value })}
          />
          <Button size="sm" disabled={adjust.isPending} onClick={() => adjust.mutate(r)}>
            Apply
          </Button>
        </div>
      ),
    },
  ];

  const txColumns: DataColumn<Tx>[] = [
    { id: "when", header: "When", cell: (t) => formatDateTime(t.createdAt) },
    { id: "product", header: "Product", cell: (t) => t.productName },
    { id: "sku", header: "SKU", cell: (t) => t.sku },
    { id: "reason", header: "Reason", cell: (t) => reasonLabel(t.reason) },
    {
      id: "change",
      header: "Change",
      cell: (t) => (
        <span className={t.difference > 0 ? "text-brand" : t.difference < 0 ? "text-danger" : ""}>
          {t.difference > 0 ? `+${t.difference}` : t.difference}
        </span>
      ),
    },
    { id: "stock", header: "Balance", cell: (t) => `${t.previousStock} → ${t.newStock}` },
    { id: "notes", header: "Notes", className: "max-w-xs truncate text-muted", cell: (t) => t.notes ?? "—" },
  ];

  const stockFilters = (
    <FilterBar>
      <Input className="w-56" placeholder="Search product or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
        <option value="all">All stock</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </Select>
      <Select value={reason} onChange={(e) => setReason(e.target.value)} className="w-48">
        {ADJUST_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      <Input className="w-56" placeholder="Adjustment note" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </FilterBar>
  );

  const txFilters = (
    <FilterBar>
      <Input className="w-56" placeholder="Search product or SKU" value={txQ} onChange={(e) => setTxQ(e.target.value)} />
      <Select value={txReason} onChange={(e) => setTxReason(e.target.value)} className="w-48">
        <option value="">All reasons</option>
        {TX_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      <Input className="w-40" type="date" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} aria-label="From date" />
      <Input className="w-40" type="date" value={txTo} onChange={(e) => setTxTo(e.target.value)} aria-label="To date" />
      {selectedVariant ? (
        <Button size="sm" variant="outline" onClick={() => setSelectedVariant(null)}>
          Clear SKU {selectedSku ?? selectedVariant}
        </Button>
      ) : null}
      {txQ || txReason || txFrom || txTo ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setTxQ("");
            setTxReason("");
            setTxFrom("");
            setTxTo("");
          }}
        >
          Reset filters
        </Button>
      ) : null}
    </FilterBar>
  );

  return (
    <AdminPage
      title="Inventory"
      description="Review stock metrics and open Table view when you need the full SKU or ledger tables."
    >
      {adjust.isError ? <FormError error={adjust.error} /> : null}
      {adjust.isSuccess ? <p className="text-sm font-medium text-brand">Stock updated.</p> : null}

      <Section
        title="Stock"
        description="Published SKUs with on-hand, reserved, and available units. Open Table view to search, adjust, and select a SKU."
        actions={
          <Button size="sm" variant="outline" onClick={() => setTableView("stock")}>
            <Table2 className="h-4 w-4" />
            Table view
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="SKUs" value={formatCompactNumber(stockMetrics.skuCount)} hint="Published variants" onClick={() => setFilter("all")} />
          <MetricCard
            label="Units on hand"
            value={formatCompactNumber(stockMetrics.unitsOnHand)}
            hint={`Available ${formatCompactNumber(stockMetrics.available)} · Reserved ${formatCompactNumber(stockMetrics.reserved)}`}
            onClick={() => setFilter("all")}
          />
          <MetricCard
            label="Inventory value"
            value={formatMoney(stockMetrics.value)}
            hint="Available units × retail price"
            onClick={() => setFilter("all")}
          />
          <MetricCard
            label="Available"
            value={formatCompactNumber(stockMetrics.available)}
            hint="On hand minus reserved"
            tone="good"
            onClick={() => setFilter("all")}
          />
          <MetricCard
            label="Low stock"
            value={formatCompactNumber(stockMetrics.lowStock)}
            hint="At or below reorder level"
            tone={stockMetrics.lowStock ? "warning" : "default"}
            onClick={() => {
              setFilter("low");
              setTableView("stock");
            }}
          />
          <MetricCard
            label="Out of stock"
            value={formatCompactNumber(stockMetrics.outOfStock)}
            hint="No sellable units left"
            tone={stockMetrics.outOfStock ? "danger" : "default"}
            onClick={() => {
              setFilter("out");
              setTableView("stock");
            }}
          />
        </div>

        <p className="text-sm text-muted">
          {selectedVariant
            ? `SKU filter active for transaction history${selectedSku ? ` · ${selectedSku}` : ""}. Open Table view to change selection.`
            : "Use Table view to browse SKUs, adjust stock, and filter transaction history."}
        </p>
      </Section>

      <Section
        title="Transaction history"
        description="Ledger of every stock movement — purchases, sales, reserves, and manual corrections. Open Table view to browse the ledger."
        actions={
          <Button size="sm" variant="outline" onClick={() => setTableView("transactions")}>
            <Table2 className="h-4 w-4" />
            Table view
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Movements"
            value={formatCompactNumber(txMetrics.movements)}
            hint={txMetrics.latest ? `Latest ${formatDateTime(txMetrics.latest)}` : "No movements yet"}
            onClick={() => {
              setTxReason("");
              setTableView("transactions");
            }}
          />
          <MetricCard
            label="Units in"
            value={`+${formatCompactNumber(txMetrics.unitsIn)}`}
            hint="Purchases, returns, and additions"
            tone="good"
          />
          <MetricCard
            label="Units out"
            value={`−${formatCompactNumber(txMetrics.unitsOut)}`}
            hint="Sales, damage, and reductions"
            tone={txMetrics.unitsOut ? "danger" : "default"}
          />
          <MetricCard
            label="Net change"
            value={`${txMetrics.net > 0 ? "+" : ""}${formatCompactNumber(txMetrics.net)}`}
            hint={`${formatCompactNumber(txMetrics.skus)} SKU${txMetrics.skus === 1 ? "" : "s"} touched`}
          />
        </div>

        {txMetrics.reasons.length ? (
          <div className="flex flex-wrap gap-2">
            {txMetrics.reasons.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setTxReason(item.value);
                  setTableView("transactions");
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  txReason === item.value
                    ? "border-brand bg-brand-soft text-brand-text"
                    : "border-line bg-surface text-ink hover:border-brand",
                )}
              >
                {item.label} · {item.count}
              </button>
            ))}
          </div>
        ) : null}
      </Section>

      <AdminTableModal
        open={tableView === "stock"}
        title="Stock"
        description="Full table view — search, filter, and adjust quantities."
        onClose={() => setTableView(null)}
        toolbar={stockFilters}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DataTable
            columns={stockColumns}
            rows={rows}
            rowKey={(r) => r.variantId}
            loading={stock.isLoading}
            empty="No stock rows match these filters."
            selectedKey={selectedVariant}
            onRowClick={(r) => setSelectedVariant((id) => (id === r.variantId ? null : r.variantId))}
            footer={`${rows.length} SKU${rows.length === 1 ? "" : "s"} · select a row to filter transaction history`}
          />
        </div>
      </AdminTableModal>

      <AdminTableModal
        open={tableView === "transactions"}
        title="Transaction history"
        description="Full ledger view — filter by SKU, reason, and date range."
        onClose={() => setTableView(null)}
        toolbar={txFilters}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DataTable
            columns={txColumns}
            rows={txRows}
            rowKey={(t) => t.id}
            loading={txs.isLoading}
            empty="No transactions match these filters."
            footer={`${txRows.length} transaction${txRows.length === 1 ? "" : "s"}`}
          />
        </div>
      </AdminTableModal>
    </AdminPage>
  );
}
