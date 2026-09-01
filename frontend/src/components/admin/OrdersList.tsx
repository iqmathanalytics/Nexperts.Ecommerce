"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import { OrderStatusFlow } from "@/components/store/OrderStatusFlow";
import { canCancelOrder, ORDER_TRANSITIONS } from "@/lib/orders";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminDrawer, AdminPage, DataTable, FilterBar } from "@/components/admin/AdminTable";

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

export function OrdersList({ title, defaultStatus = "" }: { title: string; defaultStatus?: string }) {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [status, setStatus] = useState(defaultStatus);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", dq, status],
    queryFn: () => api<{ items: Order[] }>(`/admin/orders?q=${encodeURIComponent(dq)}&status=${status}&limit=50`),
  });
  const items =
    (data?.data as unknown as { items?: Order[] })?.items ??
    (Array.isArray(data?.data) ? (data?.data as unknown as Order[]) : []);
  const rows = Array.isArray(items) ? items : [];
  const viewId = searchParams.get("view");

  function setView(id: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("view", String(id));
    else params.delete("view");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <AdminPage title={title}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search order / customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "order", header: "Order ID", cell: (o) => o.orderNumber },
          { id: "customer", header: "Customer", cell: (o) => `${o.firstName} ${o.lastName}` },
          { id: "date", header: "Date", cell: (o) => new Date(o.createdAt).toLocaleDateString() },
          { id: "amount", header: "Amount", cell: (o) => formatINR(Number(o.total)) },
          { id: "payment", header: "Payment", cell: (o) => o.paymentStatus },
          { id: "status", header: "Status", cell: (o) => o.status },
          {
            id: "actions",
            header: "Actions",
            cell: (o) => (
              <button type="button" className="text-teal-800 hover:underline" onClick={() => setView(o.id)}>
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
        footer={`${rows.length} order${rows.length === 1 ? "" : "s"}`}
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
        <p className="text-sm text-slate-500">Loading order…</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {o.status} · {o.paymentStatus}
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
                <span>{formatINR(Number(i.unitPrice) * i.quantity)}</span>
              </p>
            ))}
          </div>
          {address ? (
            <p className="mt-3 text-sm text-slate-600">
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
                  Mark {s.toLowerCase()}
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
