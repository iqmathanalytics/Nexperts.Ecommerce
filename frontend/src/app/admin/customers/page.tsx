"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminDrawer, AdminPage, DataTable, FilterBar } from "@/components/admin/AdminTable";

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

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState<number | null>(null);
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
  const status = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`/admin/customers/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", open] });
    },
  });
  const items = (data?.data as { items?: Customer[] })?.items ?? [];
  const customer = detail.data?.data;

  return (
    <AdminPage title="Customers">
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (c) => `${c.firstName} ${c.lastName}` },
          { id: "email", header: "Email", cell: (c) => c.email },
          { id: "phone", header: "Phone", cell: (c) => c.phone ?? "—" },
          { id: "orders", header: "Orders", cell: (c) => c.totalOrders },
          { id: "spend", header: "Spend", cell: (c) => formatINR(Number(c.totalSpending)) },
          { id: "last", header: "Last order", cell: (c) => (c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : "—") },
          { id: "status", header: "Status", cell: (c) => c.status },
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
          <p className="text-sm text-slate-500">Loading customer…</p>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">{customer.email}</p>
            <p>
              Orders: {customer.orders?.length ?? 0} · Reviews: {customer.reviews?.length ?? 0} · Addresses:{" "}
              {customer.addresses?.length ?? 0}
            </p>
            <p>Account status: {customer.status}</p>
            <div className="flex gap-2">
              {customer.status === "ACTIVE" ? (
                <Button size="sm" variant="danger" onClick={() => status.mutate({ id: customer.id, status: "SUSPENDED" })}>
                  Deactivate
                </Button>
              ) : (
                <Button size="sm" onClick={() => status.mutate({ id: customer.id, status: "ACTIVE" })}>
                  Activate
                </Button>
              )}
            </div>
          </div>
        )}
      </AdminDrawer>
    </AdminPage>
  );
}
