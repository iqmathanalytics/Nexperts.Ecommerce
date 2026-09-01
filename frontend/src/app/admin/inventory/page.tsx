"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPage, AdminPanel, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

type Row = {
  variantId: number;
  sku: string;
  productName: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
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

export default function InventoryPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [reason, setReason] = useState("MANUAL_ADJUSTMENT");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<number, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  const [txQ, setTxQ] = useState("");
  const dTxQ = useDebouncedValue(txQ, 300);
  const [txReason, setTxReason] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");

  const stock = useQuery({
    queryKey: ["inv", filter, dq],
    queryFn: () => api<Row[]>(`/admin/inventory?filter=${filter}&q=${encodeURIComponent(dq)}`),
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

  const rows = stock.data?.data ?? [];
  const txRows = txs.data?.data ?? [];
  const selectedSku = rows.find((r) => r.variantId === selectedVariant)?.sku;

  return (
    <AdminPage title="Inventory">
      {adjust.isError ? <FormError error={adjust.error} /> : null}
      {adjust.isSuccess ? <p className="shrink-0 text-sm text-teal-800">Stock updated.</p> : null}

      <AdminPanel
        title="Stock"
        toolbar={
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
            <Input className="w-56" placeholder="Adjustment notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FilterBar>
        }
      >
        <DataTable
          columns={[
            { id: "product", header: "Product", cell: (r) => r.productName },
            { id: "sku", header: "SKU", cell: (r) => r.sku },
            { id: "stock", header: "Stock", cell: (r) => r.stock },
            { id: "reserved", header: "Reserved", cell: (r) => r.reservedStock },
            { id: "available", header: "Available", cell: (r) => r.availableStock },
            { id: "reorder", header: "Reorder", cell: (r) => r.reorderLevel },
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
          ]}
          rows={rows}
          rowKey={(r) => r.variantId}
          loading={stock.isLoading}
          empty="No inventory rows match these filters."
          selectedKey={selectedVariant}
          onRowClick={(r) => setSelectedVariant((id) => (id === r.variantId ? null : r.variantId))}
          footer={`${rows.length} SKU${rows.length === 1 ? "" : "s"} · click a row to filter history`}
        />
      </AdminPanel>

      <AdminPanel
        title="Transaction history"
        toolbar={
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
            <Input className="w-40" type="date" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} />
            <Input className="w-40" type="date" value={txTo} onChange={(e) => setTxTo(e.target.value)} />
            {selectedVariant ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedVariant(null)}
              >
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
        }
      >
        <DataTable
          columns={[
            { id: "when", header: "When", cell: (t) => formatDateTime(t.createdAt) },
            { id: "product", header: "Product", cell: (t) => t.productName },
            { id: "sku", header: "SKU", cell: (t) => t.sku },
            { id: "reason", header: "Reason", cell: (t) => t.reason.replaceAll("_", " ") },
            {
              id: "change",
              header: "Change",
              cell: (t) => (
                <span className={t.difference > 0 ? "text-teal-800" : t.difference < 0 ? "text-red-700" : ""}>
                  {t.difference > 0 ? `+${t.difference}` : t.difference}
                </span>
              ),
            },
            { id: "stock", header: "Stock", cell: (t) => `${t.previousStock} → ${t.newStock}` },
            { id: "notes", header: "Notes", className: "max-w-xs truncate text-slate-500", cell: (t) => t.notes ?? "—" },
          ]}
          rows={txRows}
          rowKey={(t) => t.id}
          loading={txs.isLoading}
          empty="No transactions match these filters."
          footer={`${txRows.length} transaction${txRows.length === 1 ? "" : "s"}`}
        />
      </AdminPanel>
    </AdminPage>
  );
}
