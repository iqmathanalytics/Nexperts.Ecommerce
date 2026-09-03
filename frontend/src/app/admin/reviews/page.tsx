"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { useToast } from "@/components/ui/toast";

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

function statusLabel(status: string) {
  if (status === "APPROVED") return "Accepted";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  if (status === "HIDDEN") return "Hidden";
  return status;
}

export default function ReviewsAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: () => api<Review[]>(`/admin/reviews?status=${encodeURIComponent(status)}`),
  });
  const mod = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" | "HIDDEN" }) =>
      api(`/admin/reviews/${id}/moderate`, { method: "POST", body: JSON.stringify({ status }) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.push(
        v.status === "APPROVED" ? "Review accepted" : v.status === "REJECTED" ? "Review rejected" : "Review hidden",
        "success",
      );
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const del = useMutation({
    mutationFn: (id: number) => api(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.push("Review deleted", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const query = dq.trim().toLowerCase();
  const rows = (data?.data ?? []).filter((r) => {
    if (!query) return true;
    return `${r.productName} ${r.title} ${r.comment} ${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(query);
  });
  const busy = mod.isPending || del.isPending;

  return (
    <AdminPage title="Reviews" description="Accept a review to publish it on the product page. Reject or hide it to take it down.">
      <FormError error={mod.error ?? del.error} />
      {mod.isSuccess ? <p className="text-sm text-muted">Review updated.</p> : null}
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search product, review, or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="HIDDEN">Hidden</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "product", header: "Product", cell: (r) => r.productName },
          { id: "customer", header: "Customer", cell: (r) => `${r.firstName} ${r.lastName}` },
          { id: "rating", header: "Rating", cell: (r) => `${r.rating}/5` },
          {
            id: "review",
            header: "Review",
            className: "max-w-sm whitespace-normal",
            cell: (r) => (
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{r.comment}</p>
              </div>
            ),
          },
          { id: "status", header: "Status", cell: (r) => statusLabel(r.status) },
          { id: "date", header: "Date", cell: (r) => formatDate(r.createdAt) },
          {
            id: "actions",
            header: "Actions",
            cell: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.status !== "APPROVED" ? (
                  <Button size="sm" disabled={busy} onClick={() => mod.mutate({ id: r.id, status: "APPROVED" })}>
                    Accept
                  </Button>
                ) : null}
                {r.status !== "REJECTED" ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => mod.mutate({ id: r.id, status: "REJECTED" })}>
                    Reject
                  </Button>
                ) : null}
                {r.status !== "HIDDEN" ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => mod.mutate({ id: r.id, status: "HIDDEN" })}>
                    Hide
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => del.mutate(r.id)}>
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
