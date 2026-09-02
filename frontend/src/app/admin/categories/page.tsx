"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AdminDrawer, AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { mediaUrl } from "@/lib/utils";

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  status: string;
  description?: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  sortOrder?: number;
};

const emptyForm = {
  name: "",
  slug: "",
  parentId: "" as number | "",
  description: "",
  imageUrl: "",
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
  status: "ACTIVE",
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: () => api<Category[]>("/admin/categories"),
  });
  const all = data?.data ?? [];

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        slug: form.slug || undefined,
        parentId: form.parentId || null,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      };
      return editing === "new"
        ? api("/admin/categories", { method: "POST", body: JSON.stringify(body) })
        : api(`/admin/categories/${(editing as Category).id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      setEditing(null);
    },
  });
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats"] }),
  });
  const restore = useMutation({
    mutationFn: (id: number) => api(`/admin/categories/${id}/restore`, { method: "POST" }),
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

  function openNew() {
    setForm(emptyForm);
    setEditing("new");
  }
  function openEdit(c: Category) {
    setForm({
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? "",
      description: c.description ?? "",
      imageUrl: c.imageUrl ?? "",
      seoTitle: c.seoTitle ?? "",
      seoDescription: c.seoDescription ?? "",
      sortOrder: c.sortOrder ?? 0,
      status: c.status,
    });
    setEditing(c);
  }

  return (
    <AdminPage title="Categories" description="Storefront navigation groups for Woman, Man, and New." actions={<Button onClick={openNew}>Add category</Button>}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search category" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </FilterBar>
      <FormError error={archive.error ?? restore.error} />
      <DataTable
        columns={[
          {
            id: "image",
            header: "",
            cell: (c) =>
              c.imageUrl ? <img src={mediaUrl(c.imageUrl)} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="text-muted">—</span>,
          },
          { id: "name", header: "Name", cell: (c) => (c.parentId ? `— ${c.name}` : c.name) },
          { id: "slug", header: "Slug", className: "text-muted", cell: (c) => `/${c.slug}` },
          { id: "parent", header: "Parent", cell: (c) => (c.parentId ? parentName.get(c.parentId) ?? "—" : "Top level") },
          { id: "status", header: "Status", cell: (c) => c.status },
          {
            id: "actions",
            header: "",
            cell: (c) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                {c.status === "ARCHIVED" ? (
                  <Button size="sm" variant="ghost" onClick={() => restore.mutate(c.id)}>
                    Restore
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => archive.mutate(c.id)}>
                    Archive
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        loading={isLoading}
        empty="No categories match these filters."
        footer={`${rows.length} categor${rows.length === 1 ? "y" : "ies"} · used in shop filters and category pages`}
      />
      <AdminDrawer open={Boolean(editing)} title={editing === "new" ? "Add category" : "Edit category"} onClose={() => setEditing(null)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim()) save.mutate();
          }}
        >
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
          </div>
          <div>
            <Label>Parent</Label>
            <select
              className="h-11 w-full rounded-sm border border-line bg-surface px-2 text-sm"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">Top level</option>
              {all
                .filter((c) => !c.parentId && c.status === "ACTIVE" && (editing === "new" || c.id !== (editing as Category)?.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Label>Description (category page)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <AdminImageField label="Image" value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} folder="categories" />
          <div>
            <Label>SEO title</Label>
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </div>
          <div>
            <Label>SEO description</Label>
            <Textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
          </div>
          <div>
            <Label>Sort order</Label>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>ACTIVE</option>
              <option>ARCHIVED</option>
            </Select>
          </div>
          <FormError error={save.error} />
          <Button type="submit" disabled={save.isPending}>
            Save
          </Button>
        </form>
      </AdminDrawer>
    </AdminPage>
  );
}
