"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";

type Category = { id: number; name: string; slug: string; parentId: number | null; status: string };

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: () => api<Category[]>("/admin/categories"),
  });
  const all = data?.data ?? [];
  const create = useMutation({
    mutationFn: () => api("/admin/categories", { method: "POST", body: JSON.stringify({ name, parentId: parentId || null }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      setName("");
    },
  });
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats"] }),
  });
  const parentName = useMemo(() => new Map(all.map((c) => [c.id, c.name])), [all]);
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all.filter((c) => {
      if (query && !`${c.name} ${c.slug}`.toLowerCase().includes(query)) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }, [all, q, status]);

  return (
    <AdminPage title="Categories">
      <form
        className="flex shrink-0 flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <Input className="max-w-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select
          className="h-10 rounded-md border border-line bg-white px-2 text-sm"
          value={parentId}
          onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Top level</option>
          {all.filter((c) => !c.parentId && c.status === "ACTIVE").map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={create.isPending}>
          Add
        </Button>
        <FormError error={create.error ?? archive.error} />
      </form>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search category" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (c) => (c.parentId ? `— ${c.name}` : c.name) },
          { id: "slug", header: "Slug", className: "text-slate-500", cell: (c) => `/${c.slug}` },
          { id: "parent", header: "Parent", cell: (c) => (c.parentId ? parentName.get(c.parentId) ?? "—" : "Top level") },
          { id: "status", header: "Status", cell: (c) => c.status },
          {
            id: "actions",
            header: "",
            cell: (c) => (
              <Button size="sm" variant="ghost" onClick={() => archive.mutate(c.id)}>
                Archive
              </Button>
            ),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        loading={isLoading}
        empty="No categories match these filters."
        footer={`${rows.length} categor${rows.length === 1 ? "y" : "ies"}`}
      />
    </AdminPage>
  );
}
