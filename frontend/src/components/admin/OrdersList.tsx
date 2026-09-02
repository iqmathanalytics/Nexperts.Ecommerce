"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate, formatMoney } from "@/lib/utils";
import { OrderStatusFlow } from "@/components/store/OrderStatusFlow";
import { canCancelOrder, ORDER_TRANSITIONS } from "@/lib/orders";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminDrawer, AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const PAYMENTS = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;

type Order = {
  id: number;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  total: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

type OrderDetail = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  shippingAddress?: Record<string, string> | string | null;
  items: Array<{ id: number; productName: string; sku: string; quantity: number; unitPrice: string }>;
};

function labelStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function OrdersList({ title, defaultStatus = "" }: { title: string; defaultStatus?: string }) {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [status, setStatus] = useState(defaultStatus);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("CONFIRMED");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", dq, status, paymentStatus, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dq) params.set("q", dq);
      if (status) params.set("status", status);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("limit", "100");
      return api<{ items: Order[]; total?: number }>(`/admin/orders?${params.toString()}`);
    },
  });
  const items =
    (data?.data as unknown as { items?: Order[] })?.items ??
    (Array.isArray(data?.data) ? (data?.data as unknown as Order[]) : []);
  const rows = Array.isArray(items) ? items : [];
  const viewId = searchParams.get("view");
  const allSelected = rows.length > 0 && rows.every((o) => selected.includes(o.id));
  const hasFilters = Boolean(q || (status && status !== defaultStatus) || paymentStatus || from || to);

  const bulk = useMutation({
    mutationFn: () =>
      api<{ updated: number; failed: number }>(`/admin/orders/bulk-status`, {
        method: "POST",
        body: JSON.stringify({
          ids: selected,
          status: bulkStatus,
          note: bulkStatus === "CANCELLED" ? "Cancelled by admin" : `Marked ${labelStatus(bulkStatus)} by admin`,
        }),
      }),
    onSuccess: (res) => {
      const updated = res.data?.updated ?? 0;
      const failed = res.data?.failed ?? 0;
      setBulkMsg(
        failed
          ? `Updated ${updated} order${updated === 1 ? "" : "s"}. ${failed} could not move to ${labelStatus(bulkStatus)}.`
          : `Updated ${updated} order${updated === 1 ? "" : "s"} to ${labelStatus(bulkStatus)}.`,
      );
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => setBulkMsg(e.message),
  });

  function setView(id: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("view", String(id));
    else params.delete("view");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((o) => o.id));
  }

  const selectedPreview = useMemo(
    () => rows.filter((o) => selected.includes(o.id)).slice(0, 3),
    [rows, selected],
  );

  return (
    <AdminPage title={title} description="Search and filter orders, then confirm or update them in one place.">
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search order, name, or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {labelStatus(s)}
            </option>
          ))}
        </Select>
        <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-44">
          <option value="">All payments</option>
          {PAYMENTS.map((s) => (
            <option key={s} value={s}>
              {labelStatus(s)}
            </option>
          ))}
        </Select>
        <Input className="w-40" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input className="w-40" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        {hasFilters ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setQ("");
              setStatus(defaultStatus);
              setPaymentStatus("");
              setFrom("");
              setTo("");
            }}
          >
            Reset filters
          </Button>
        ) : null}
      </FilterBar>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3">
          <p className="text-sm font-medium">
            {selected.length} marked
            {selectedPreview.length ? (
              <span className="ml-1 font-normal text-muted">
                · {selectedPreview.map((o) => `${o.firstName} ${o.lastName}`.trim() || o.email).join(", ")}
                {selected.length > selectedPreview.length ? "…" : ""}
              </span>
            ) : null}
          </p>
          <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="w-44">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelStatus(s)}
              </option>
            ))}
          </Select>
          <Button size="sm" disabled={bulk.isPending} onClick={() => bulk.mutate()}>
            {bulk.isPending ? "Updating…" : "Change status"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
          <p className="w-full text-xs text-muted">Only orders that can legally move to this status are updated. The rest stay as they are.</p>
        </div>
      ) : null}

      {bulk.isError ? <FormError error={bulk.error} /> : null}
      {bulkMsg ? <p className="text-sm text-brand-text">{bulkMsg}</p> : null}

      <DataTable
        columns={[
          {
            id: "pick",
            header: "",
            headerClassName: "w-10",
            cell: (o) => (
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => toggle(o.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Mark ${o.orderNumber}`}
              />
            ),
          },
          { id: "order", header: "Order", cell: (o) => o.orderNumber },
          {
            id: "customer",
            header: "Customer",
            cell: (o) => (
              <span>
                <span className="block font-medium">
                  {o.firstName} {o.lastName}
                </span>
                <span className="text-[11px] text-muted">{o.email}</span>
              </span>
            ),
          },
          { id: "date", header: "Date", cell: (o) => formatDate(o.createdAt) },
          { id: "amount", header: "Amount", cell: (o) => formatMoney(Number(o.total)) },
          { id: "payment", header: "Payment", cell: (o) => labelStatus(o.paymentStatus) },
          { id: "status", header: "Status", cell: (o) => labelStatus(o.status) },
          {
            id: "actions",
            header: "Actions",
            cell: (o) => (
              <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setView(o.id)}>
                View
              </button>
            ),
          },
        ]}
        rows={rows}
        rowKey={(o) => o.id}
        loading={isLoading}
        empty="No orders match these filters."
        selectedKey={viewId ? Number(viewId) : null}
        onRowClick={(o) => setView(o.id)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-ink">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Mark all on this page
            </label>
            <span>
              {rows.length} order{rows.length === 1 ? "" : "s"}
              {selected.length ? ` · ${selected.length} marked` : ""}
            </span>
          </div>
        }
      />
      <OrderDrawer
        viewId={viewId}
        onClose={() => setView(null)}
        onInvalidate={() => qc.invalidateQueries({ queryKey: ["admin-orders"] })}
      />
    </AdminPage>
  );
}

function OrderDrawer({
  viewId,
  onClose,
  onInvalidate,
}: {
  viewId: string | null;
  onClose: () => void;
  onInvalidate: () => void;
}) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-order", viewId],
    queryFn: () => api<OrderDetail>(`/admin/orders/${viewId}`),
    enabled: Boolean(viewId),
  });
  const update = useMutation({
    mutationFn: ({ status, note }: { status: string; note: string }) =>
      api(`/admin/orders/${viewId}/status`, { method: "POST", body: JSON.stringify({ status, note }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", viewId] });
      onInvalidate();
    },
  });
  const cancel = useMutation({
    mutationFn: () => api(`/admin/orders/${viewId}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Cancelled by admin" }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", viewId] });
      onInvalidate();
    },
  });
  const o = data?.data;
  const next = o ? ORDER_TRANSITIONS[o.status] ?? [] : [];
  const rawAddress = o?.shippingAddress;
  const address =
    typeof rawAddress === "string" ? safeParse(rawAddress) : rawAddress && typeof rawAddress === "object" ? rawAddress : null;

  const statusNote: Record<string, string> = {
    CONFIRMED: "Order confirmed by store",
    PROCESSING: "Order is being prepared",
    PACKED: "Package packed and ready to ship",
    SHIPPED: "Package handed to courier",
    DELIVERED: "Package delivered to customer",
  };

  return (
    <AdminDrawer open={Boolean(viewId)} title={o?.orderNumber ?? "Order"} onClose={onClose}>
      {!o ? (
        <p className="text-sm text-muted">Loading order…</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {labelStatus(o.status)} · {labelStatus(o.paymentStatus)}
          </p>
          <div className="mt-3">
            <OrderStatusFlow status={o.status} />
          </div>
          <div className="mt-4 space-y-1 text-sm">
            {(o.items ?? []).map((i) => (
              <p key={i.id} className="flex justify-between gap-3">
                <span>
                  {i.productName} × {i.quantity} ({i.sku})
                </span>
                <span>{formatMoney(Number(i.unitPrice) * i.quantity)}</span>
              </p>
            ))}
          </div>
          {address ? (
            <p className="mt-3 text-sm text-muted">
              Ship to {address.fullName}, {address.line1}, {address.city} {address.postalCode}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {next
              .filter((s) => s !== "CANCELLED")
              .map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ status: s, note: statusNote[s] ?? `Marked ${s.toLowerCase()}` })}
                >
                  Mark {labelStatus(s)}
                </Button>
              ))}
            {canCancelOrder(o.status) ? (
              <Button size="sm" variant="danger" onClick={() => cancel.mutate()}>
                Cancel order
              </Button>
            ) : null}
          </div>
        </>
      )}
    </AdminDrawer>
  );
}

function safeParse(value: string) {
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return null;
  }
}
