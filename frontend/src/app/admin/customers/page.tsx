"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminDrawer, AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { useToast } from "@/components/ui/toast";
import { confirmAction } from "@/lib/confirm";

type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpending: string | number;
  lastOrder: string | null;
  status: string;
};

type CustomerDetail = Customer & {
  orders?: unknown[];
  reviews?: unknown[];
  addresses?: unknown[];
};

function statusLabel(status: string) {
  if (status === "SUSPENDED") return "Deactivated";
  if (status === "DELETED") return "Deleted";
  return "Active";
}

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["customers", dq, statusFilter],
    queryFn: () =>
      api<{ items: Customer[] }>(
        `/admin/customers?q=${encodeURIComponent(dq)}&status=${statusFilter}&limit=50`,
      ),
  });
  const detail = useQuery({
    queryKey: ["customer", open],
    queryFn: () => api<CustomerDetail>(`/admin/customers/${open}`),
    enabled: Boolean(open),
  });
  const qc = useQueryClient();
  const toast = useToast();

  function refresh() {
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["customer", open] });
  }

  const status = useMutation({
    mutationFn: ({ id, next }: { id: number; next: "ACTIVE" | "SUSPENDED" }) =>
      api(`/admin/customers/${id}/status`, { method: "POST", body: JSON.stringify({ status: next }) }),
    onSuccess: (_d, v) => {
      setConfirmDelete(null);
      refresh();
      toast.push(v.next === "ACTIVE" ? "Customer activated" : "Customer deactivated", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const restore = useMutation({
    mutationFn: (id: number) => api(`/admin/customers/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      setConfirmDelete(null);
      refresh();
      toast.push("Customer restored", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/admin/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setConfirmDelete(null);
      setOpen(null);
      refresh();
      toast.push("Customer deleted", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const items = (data?.data as { items?: Customer[] })?.items ?? [];
  const customer = detail.data?.data;
  const busy = status.isPending || restore.isPending || remove.isPending;

  function accountActions(c: Customer, fromRow = false) {
    return (
      <div
        className="flex flex-wrap gap-2"
        onClick={fromRow ? (e) => e.stopPropagation() : undefined}
      >
        {c.status === "ACTIVE" ? (
          <Button
            size="sm"
            variant="outline"
            pending={busy}
            onClick={() => {
              if (confirmAction(`Deactivate ${c.firstName} ${c.lastName}? They will not be able to sign in.`)) {
                status.mutate({ id: c.id, next: "SUSPENDED" });
              }
            }}
          >
            Deactivate
          </Button>
        ) : null}
        {c.status === "SUSPENDED" ? (
          <Button
            size="sm"
            pending={busy}
            onClick={() => {
              if (confirmAction(`Activate ${c.firstName} ${c.lastName}?`)) status.mutate({ id: c.id, next: "ACTIVE" });
            }}
          >
            Activate
          </Button>
        ) : null}
        {c.status === "DELETED" ? (
          <Button
            size="sm"
            pending={busy}
            onClick={() => {
              if (confirmAction(`Restore ${c.firstName} ${c.lastName}?`)) restore.mutate(c.id);
            }}
          >
            Restore
          </Button>
        ) : (
          <Button size="sm" variant="danger" pending={busy} onClick={() => setConfirmDelete(c)}>
            Delete
          </Button>
        )}
      </div>
    );
  }

  return (
    <AdminPage title="Customers" description="Deactivate a member so they cannot sign in, or delete the account. Order history is kept.">
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Deactivated</option>
          <option value="DELETED">Deleted</option>
        </Select>
      </FilterBar>
      <FormError error={status.error ?? restore.error ?? remove.error} />
      {confirmDelete ? (
        <div className="rounded-2xl border border-danger/30 bg-[#f8e8e9] p-4 text-sm">
          <p className="font-semibold text-[#8a1c24]">Delete {confirmDelete.firstName} {confirmDelete.lastName}?</p>
          <p className="mt-1 text-[#8a1c24]/80">
            {confirmDelete.email} will not be able to sign in. Orders stay in reports. You can restore the account later.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="danger" pending={remove.isPending} onClick={() => remove.mutate(confirmDelete.id)}>
              {remove.isPending ? "Deleting…" : "Delete account"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (c) => `${c.firstName} ${c.lastName}` },
          { id: "email", header: "Email", cell: (c) => c.email },
          { id: "phone", header: "Phone", cell: (c) => c.phone ?? "—" },
          { id: "orders", header: "Orders", cell: (c) => c.totalOrders },
          { id: "spend", header: "Spend", cell: (c) => formatINR(Number(c.totalSpending)) },
          { id: "last", header: "Last order", cell: (c) => (c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : "—") },
          { id: "status", header: "Status", cell: (c) => statusLabel(c.status) },
          { id: "actions", header: "Account", cell: (c) => accountActions(c, true) },
        ]}
        rows={items}
        rowKey={(c) => c.id}
        loading={isLoading}
        empty="No customers match these filters."
        selectedKey={open}
        onRowClick={(c) => setOpen(c.id)}
        footer={`${items.length} customer${items.length === 1 ? "" : "s"}`}
      />
      <AdminDrawer open={Boolean(open)} title={customer ? `${customer.firstName} ${customer.lastName}` : "Customer"} onClose={() => setOpen(null)}>
        {!customer ? (
          <p className="text-sm text-muted">Loading customer…</p>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-muted">{customer.email}</p>
            <p>
              Orders: {customer.orders?.length ?? 0} · Reviews: {customer.reviews?.length ?? 0} · Addresses:{" "}
              {customer.addresses?.length ?? 0}
            </p>
            <p>Account status: {statusLabel(customer.status)}</p>
            <p className="text-xs text-muted">
              Deactivate blocks sign-in. Delete marks the account removed; orders are not erased.
            </p>
            {accountActions(customer)}
            <FormError error={status.error ?? restore.error ?? remove.error} />
          </div>
        )}
      </AdminDrawer>
    </AdminPage>
  );
}
