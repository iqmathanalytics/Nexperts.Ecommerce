"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AdminDrawer, AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminProductPicker } from "@/components/admin/AdminProductPicker";

type Lookbook = {
  id: number;
  title: string;
  slug: string;
  status: string;
  brandId?: number | null;
  brandName?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  videoUrl?: string | null;
  productCount?: number;
  productIds?: number[];
};

const emptyForm = {
  title: "",
  slug: "",
  brandId: "" as number | "",
  description: "",
  coverImageUrl: "",
  videoUrl: "",
  status: "ACTIVE",
  productIds: [] as number[],
};

export default function LookbooksPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Lookbook | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-lookbooks"],
    queryFn: () => api<Lookbook[]>("/admin/lookbooks"),
  });
  const brands = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => api<Array<{ id: number; name: string; status?: string }>>("/admin/brands"),
  });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        slug: form.slug || undefined,
        brandId: form.brandId === "" ? null : Number(form.brandId),
      };
      return editing === "new"
        ? api("/admin/lookbooks", { method: "POST", body: JSON.stringify(body) })
        : api(`/admin/lookbooks/${(editing as Lookbook).id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lookbooks"] });
      setEditing(null);
    },
  });
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/lookbooks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-lookbooks"] }),
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const query = q.trim().toLowerCase();
    return query ? all.filter((l) => `${l.title} ${l.slug}`.toLowerCase().includes(query)) : all;
  }, [data?.data, q]);

  async function openEdit(l: Lookbook) {
    const detail = await api<Lookbook>(`/admin/lookbooks/${l.id}`);
    const row = detail.data;
    setForm({
      title: row.title,
      slug: row.slug,
      brandId: row.brandId ?? "",
      description: row.description ?? "",
      coverImageUrl: row.coverImageUrl ?? "",
      videoUrl: row.videoUrl ?? "",
      status: row.status,
      productIds: row.productIds ?? [],
    });
    setEditing(row);
  }

  return (
    <AdminPage title="Lookbooks" description="Lookbooks appear on the homepage carousel and at /lookbooks/[slug]." actions={<Button onClick={() => { setForm(emptyForm); setEditing("new"); }}>Add lookbook</Button>}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search lookbook" value={q} onChange={(e) => setQ(e.target.value)} />
      </FilterBar>
      <FormError error={archive.error} />
      <DataTable
        columns={[
          { id: "title", header: "Title", cell: (l) => l.title },
          { id: "slug", header: "Store URL", className: "text-muted", cell: (l) => `/lookbooks/${l.slug}` },
          { id: "brand", header: "Brand", cell: (l) => l.brandName ?? "—" },
          { id: "products", header: "Products", cell: (l) => l.productCount ?? 0 },
          { id: "status", header: "Status", cell: (l) => l.status },
          {
            id: "actions",
            header: "",
            cell: (l) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => archive.mutate(l.id)}>
                  Archive
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(l) => l.id}
        loading={isLoading}
        empty="No lookbooks yet."
      />
      <AdminDrawer open={Boolean(editing)} title={editing === "new" ? "Add lookbook" : "Edit lookbook"} onClose={() => setEditing(null)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim()) save.mutate();
          }}
        >
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <Label>Brand</Label>
            <Select value={String(form.brandId)} onChange={(e) => setForm({ ...form, brandId: e.target.value ? Number(e.target.value) : "" })}>
              <option value="">None</option>
              {(brands.data?.data ?? [])
                .filter((b) => (b.status ?? "ACTIVE") === "ACTIVE")
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <AdminImageField
            label="Cover image"
            value={form.coverImageUrl}
            onChange={(coverImageUrl) => setForm({ ...form, coverImageUrl })}
            folder="lookbooks"
            hint="Lookbook cover for the homepage carousel."
          />
          <div>
            <Label>Video URL (optional)</Label>
            <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          </div>
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
          <Button type="submit" disabled={save.isPending}>
            Save
          </Button>
        </form>
      </AdminDrawer>
    </AdminPage>
  );
}
