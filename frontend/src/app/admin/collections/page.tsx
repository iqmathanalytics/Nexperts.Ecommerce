"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AdminDrawer, AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminProductPicker } from "@/components/admin/AdminProductPicker";
import { useToast } from "@/components/ui/toast";
import { confirmAction } from "@/lib/confirm";

type Collection = {
  id: number;
  name: string;
  slug: string;
  season: string;
  status: string;
  description?: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  productCount?: number;
  productIds?: number[];
};

const emptyForm = {
  name: "",
  slug: "",
  season: "festive",
  description: "",
  imageUrl: "",
  seoTitle: "",
  seoDescription: "",
  status: "ACTIVE",
  productIds: [] as number[],
};

export default function CollectionsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Collection | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => api<Collection[]>("/admin/collections"),
  });

  const save = useMutation({
    mutationFn: () => {
      if (form.name.trim().length < 2) throw new Error("Name must be at least 2 characters");
      const body = {
        name: form.name.trim(),
        slug: form.slug || undefined,
        season: form.season,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        status: form.status,
        productIds: form.productIds,
      };
      return editing === "new"
        ? api("/admin/collections", { method: "POST", body: JSON.stringify(body) })
        : api(`/admin/collections/${(editing as Collection).id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.push(editing === "new" ? "Collection created" : "Collection saved", "success");
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/collections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.push("Collection archived", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const query = q.trim().toLowerCase();
    return query ? all.filter((c) => `${c.name} ${c.slug} ${c.season}`.toLowerCase().includes(query)) : all;
  }, [data?.data, q]);

  async function openEdit(c: Collection) {
    try {
      const detail = await api<Collection>(`/admin/collections/${c.id}`);
      const row = detail.data;
      setForm({
        name: row.name,
        slug: row.slug,
        season: row.season,
        description: row.description ?? "",
        imageUrl: row.imageUrl ?? "",
        seoTitle: row.seoTitle ?? "",
        seoDescription: row.seoDescription ?? "",
        status: row.status,
        productIds: row.productIds ?? [],
      });
      setEditing(row);
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "Could not open collection", "error");
    }
  }

  return (
    <AdminPage title="Collections" description="Seasonal collections power /collections/seasonal/festive and similar pages. One active collection per season is shown." actions={<Button onClick={() => { setForm(emptyForm); setEditing("new"); }}>Add collection</Button>}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search collection" value={q} onChange={(e) => setQ(e.target.value)} />
      </FilterBar>
      <FormError error={archive.error} />
      <DataTable
        columns={[
          { id: "name", header: "Name", cell: (c) => c.name },
          { id: "season", header: "Season", cell: (c) => c.season },
          { id: "slug", header: "Store URL", className: "text-muted", cell: (c) => `/collections/seasonal/${c.season}` },
          { id: "products", header: "Products", cell: (c) => c.productCount ?? 0 },
          { id: "status", header: "Status", cell: (c) => c.status },
          {
            id: "actions",
            header: "",
            cell: (c) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  pending={archive.isPending}
                  onClick={() => {
                    if (confirmAction(`Archive “${c.name}”? It will hide from the storefront.`)) archive.mutate(c.id);
                  }}
                >
                  Archive
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        loading={isLoading}
        empty="No collections yet."
      />
      <AdminDrawer open={Boolean(editing)} title={editing === "new" ? "Add collection" : "Edit collection"} onClose={() => setEditing(null)}>
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
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <Label>Season</Label>
            <Select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
              <option value="spring">spring</option>
              <option value="summer">summer</option>
              <option value="festive">festive</option>
              <option value="winter">winter</option>
              <option value="all">all</option>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <AdminImageField
            label="Cover image"
            value={form.imageUrl}
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            folder="collections"
            hint="Seasonal collection banner."
          />
          <AdminProductPicker selectedIds={form.productIds} onChange={(productIds) => setForm({ ...form, productIds })} />
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>ACTIVE</option>
              <option>DRAFT</option>
              <option>ARCHIVED</option>
            </Select>
          </div>
          <FormError error={save.error} />
          <div className="flex gap-2 pt-1">
            <Button type="submit" pending={save.isPending} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={save.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </AdminDrawer>
    </AdminPage>
  );
}
