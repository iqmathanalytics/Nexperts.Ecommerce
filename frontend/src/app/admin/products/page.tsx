"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Badge, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPage, DataTable, FilterBar } from "@/components/admin/AdminTable";

type Product = { id: number; name: string; status: string; slug: string; gender?: string };

export default function AdminProducts() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [status, setStatus] = useState("PUBLISHED");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", dq, status],
    queryFn: () => api<Product[]>(`/admin/products?q=${encodeURIComponent(dq)}&status=${status}&limit=50`),
  });
  const rows = data?.data ?? [];

  return (
    <AdminPage title="Products" actions={<Link href="/admin/products/create"><Button>Create product</Button></Link>}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search name or slug" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (p) => p.name },
          { id: "slug", header: "Slug", className: "text-slate-500", cell: (p) => `/${p.slug}` },
          {
            id: "gender",
            header: "Gender",
            cell: (p) => (p.gender === "MEN" ? "Men" : p.gender === "WOMEN" ? "Women" : "Unisex"),
          },
          { id: "status", header: "Status", cell: (p) => <Badge>{p.status}</Badge> },
          {
            id: "edit",
            header: "",
            cell: (p) => (
              <Link href={`/admin/products/${p.id}`} className="text-teal-800 hover:underline">
                Edit
              </Link>
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
