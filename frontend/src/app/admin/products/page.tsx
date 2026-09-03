"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Badge, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { useToast } from "@/components/ui/toast";
import { confirmAction } from "@/lib/confirm";
import { formatMoney, mediaUrl } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  status: string;
  slug: string;
  gender?: string;
  imageUrl?: string | null;
  price?: number | null;
  isFeatured?: boolean;
  isNew?: boolean;
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 150);
  const [status, setStatus] = useState("PUBLISHED");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", dq, status],
    queryFn: () => api<Product[]>(`/admin/products?q=${encodeURIComponent(dq)}&status=${status}&limit=50`),
  });
  const rows = data?.data ?? [];
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.push("Product archived", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const restore = useMutation({
    mutationFn: (id: number) => api(`/admin/products/${id}/status`, { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.push("Product restored", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const duplicate = useMutation({
    mutationFn: (id: number) => api<{ id: number }>(`/admin/products/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.push("Product duplicated", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  return (
    <AdminPage title="Products" description="Published products appear in the storefront." actions={<Link href="/admin/products/create"><Button>Create product</Button></Link>}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search name or slug" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </FilterBar>
      <FormError error={archive.error ?? restore.error ?? duplicate.error} />
      <DataTable
        columns={[
          {
            id: "image",
            header: "",
            cell: (p) =>
              p.imageUrl ? <img src={mediaUrl(p.imageUrl)} alt="" className="h-12 w-10 rounded object-cover" /> : <span className="text-muted">—</span>,
          },
          { id: "name", header: "Name", cell: (p) => p.name },
          { id: "slug", header: "Slug", className: "text-muted", cell: (p) => `/${p.slug}` },
          {
            id: "price",
            header: "Price",
            cell: (p) => (p.price != null ? formatMoney(Number(p.price)) : "—"),
          },
          {
            id: "gender",
            header: "Gender",
            cell: (p) => (p.gender === "MEN" ? "Men" : p.gender === "WOMEN" ? "Women" : "Unisex"),
          },
          {
            id: "flags",
            header: "Shop",
            cell: (p) => (
              <span className="flex flex-wrap gap-1">
                {p.isFeatured ? <Badge>Featured</Badge> : null}
                {p.isNew ? <Badge>New</Badge> : null}
              </span>
            ),
          },
          { id: "status", header: "Status", cell: (p) => <Badge>{p.status}</Badge> },
          {
            id: "edit",
            header: "",
            cell: (p) => (
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/products/${p.id}`} className="font-semibold text-brand hover:underline">
                  Edit
                </Link>
                <button
                  type="button"
                  className="text-sm text-muted hover:underline disabled:opacity-50"
                  disabled={duplicate.isPending}
                  onClick={() => {
                    if (confirmAction(`Duplicate “${p.name}”?`)) duplicate.mutate(p.id);
                  }}
                >
                  Duplicate
                </button>
                {p.status === "ARCHIVED" ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand hover:underline disabled:opacity-50"
                    disabled={restore.isPending}
                    onClick={() => {
                      if (confirmAction(`Restore “${p.name}” to the shop?`)) restore.mutate(p.id);
                    }}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-danger hover:underline disabled:opacity-50"
                    disabled={archive.isPending}
                    onClick={() => {
                      if (confirmAction(`Remove “${p.name}” from the shop? You can restore it later from Archived.`)) {
                        archive.mutate(p.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(p) => p.id}
        loading={isLoading}
        empty="No products match these filters."
        footer={
          status === "PUBLISHED"
            ? `${rows.length} published · same catalog customers see in the shop`
            : `${rows.length} product${rows.length === 1 ? "" : "s"}`
        }
      />
    </AdminPage>
  );
}
