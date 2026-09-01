"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

type Brand = { id: number; name: string; slug: string; status?: string };

export default function BrandsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => api<Brand[]>("/admin/brands"),
  });
  const create = useMutation({
    mutationFn: () => api("/admin/brands", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      setName("");
    },
  });
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-brands"] }),
  });
  const logo = async (id: number, file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    await api(`/admin/brands/${id}/logo`, { method: "POST", body: fd });
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };
  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const query = q.trim().toLowerCase();
    return all.filter((b) => {
      if (query && !`${b.name} ${b.slug}`.toLowerCase().includes(query)) return false;
      if (status && (b.status ?? "ACTIVE") !== status) return false;
      return true;
    });
  }, [data?.data, q, status]);

  return (
    <AdminPage title="Brands">
      <form
        className="flex shrink-0 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <Input className="max-w-sm" placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={create.isPending}>
          Add
        </Button>
        <FormError error={create.error ?? archive.error} />
      </form>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search brand" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (b) => b.name },
          { id: "slug", header: "Slug", className: "text-slate-500", cell: (b) => `/${b.slug}` },
          { id: "status", header: "Status", cell: (b) => b.status ?? "ACTIVE" },
          {
            id: "logo",
            header: "Logo",
            cell: (b) => (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && logo(b.id, e.target.files[0])}
              />
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (b) => (
              <Button size="sm" variant="ghost" onClick={() => archive.mutate(b.id)}>
                Archive
              </Button>
            ),
          },
        ]}
        rows={rows}
        rowKey={(b) => b.id}
        loading={isLoading}
        empty="No brands match these filters."
        footer={`${rows.length} brand${rows.length === 1 ? "" : "s"}`}
      />
    </AdminPage>
  );
}
