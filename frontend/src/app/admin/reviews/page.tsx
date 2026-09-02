"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

type Review = {
  id: number;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export default function ReviewsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: () => api<Review[]>(`/admin/reviews?status=${encodeURIComponent(status)}`),
  });
  const mod = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`/admin/reviews/${id}/moderate`, { method: "POST", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });
  const query = dq.trim().toLowerCase();
  const rows = (data?.data ?? []).filter((r) => {
    if (!query) return true;
    return `${r.productName} ${r.title} ${r.comment} ${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(query);
  });

  return (
    <AdminPage title="Reviews" description="Customer product reviews awaiting moderation or already published.">
      <FormError error={mod.error ?? del.error} />
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search product, review, or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="HIDDEN">Hidden</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "product", header: "Product", cell: (r) => r.productName },
          { id: "customer", header: "Customer", cell: (r) => `${r.firstName} ${r.lastName}` },
          { id: "rating", header: "Rating", cell: (r) => `${r.rating}/5` },
          { id: "title", header: "Title", className: "max-w-xs truncate", cell: (r) => r.title },
          { id: "status", header: "Status", cell: (r) => r.status },
          { id: "date", header: "Date", cell: (r) => formatDate(r.createdAt) },
          {
            id: "actions",
            header: "Actions",
            cell: (r) => (
              <div className="flex gap-1">
                <Button size="sm" onClick={() => mod.mutate({ id: r.id, status: "APPROVED" })}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => mod.mutate({ id: r.id, status: "REJECTED" })}>
                  Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => mod.mutate({ id: r.id, status: "HIDDEN" })}>
                  Hide
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        empty="No reviews match these filters."
        footer={`${rows.length} review${rows.length === 1 ? "" : "s"}`}
      />
    </AdminPage>
  );
}
