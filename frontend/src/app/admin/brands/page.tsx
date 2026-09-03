"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AdminDrawer, AdminPage, DataTable, FilterBar, FormError } from "@/components/admin/AdminTable";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { useToast } from "@/components/ui/toast";
import { mediaUrl } from "@/lib/utils";

type Brand = {
  id: number;
  name: string;
  slug: string;
  status?: string;
  description?: string | null;
  logoUrl?: string | null;
  lookbookBio?: string | null;
  heroImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  lookbookBio: "",
  logoUrl: "",
  heroImageUrl: "",
  seoTitle: "",
  seoDescription: "",
  status: "ACTIVE",
};

export default function BrandsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => api<Brand[]>("/admin/brands"),
  });

  const save = useMutation({
    mutationFn: () => {
      if (form.name.trim().length < 2) throw new Error("Name must be at least 2 characters");
      const body = {
        name: form.name.trim(),
        slug: form.slug || undefined,
        description: form.description || null,
        lookbookBio: form.lookbookBio || null,
        logoUrl: form.logoUrl || null,
        heroImageUrl: form.heroImageUrl || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        status: form.status,
      };
      return editing === "new"
        ? api("/admin/brands", { method: "POST", body: JSON.stringify(body) })
        : api(`/admin/brands/${(editing as Brand).id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.push(editing === "new" ? "Brand created" : "Brand saved", "success");
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const archive = useMutation({
    mutationFn: (id: number) => api(`/admin/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.push("Brand archived", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });
  const restore = useMutation({
    mutationFn: (id: number) => api(`/admin/brands/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.push("Brand restored", "success");
    },
    onError: (e: Error) => toast.push(e.message, "error"),
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const query = q.trim().toLowerCase();
    return all.filter((b) => {
      if (query && !`${b.name} ${b.slug}`.toLowerCase().includes(query)) return false;
      if (status && (b.status ?? "ACTIVE") !== status) return false;
      return true;
    });
  }, [data?.data, q, status]);

  function openNew() {
    setForm(emptyForm);
    setEditing("new");
  }
  function openEdit(b: Brand) {
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description ?? "",
      lookbookBio: b.lookbookBio ?? "",
      logoUrl: b.logoUrl ?? "",
      heroImageUrl: b.heroImageUrl ?? "",
      seoTitle: b.seoTitle ?? "",
      seoDescription: b.seoDescription ?? "",
      status: b.status ?? "ACTIVE",
    });
    setEditing(b);
  }

  return (
    <AdminPage title="Brands" description="Brand labels shown on product cards and filters." actions={<Button onClick={openNew}>Add brand</Button>}>
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search brand" value={q} onChange={(e) => setQ(e.target.value)} />
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
            id: "logo",
            header: "Logo",
            cell: (b) =>
              b.logoUrl ? <img src={mediaUrl(b.logoUrl)} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="text-muted">—</span>,
          },
          { id: "name", header: "Name", cell: (b) => b.name },
          { id: "slug", header: "Slug", className: "text-muted", cell: (b) => `/designers/${b.slug}` },
          { id: "status", header: "Status", cell: (b) => b.status ?? "ACTIVE" },
          {
            id: "actions",
            header: "",
            cell: (b) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                  Edit
                </Button>
                {(b.status ?? "ACTIVE") === "ARCHIVED" ? (
                  <Button size="sm" variant="ghost" onClick={() => restore.mutate(b.id)}>
                    Restore
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => archive.mutate(b.id)}>
                    Archive
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(b) => b.id}
        loading={isLoading}
        empty="No brands match these filters."
        footer={`${rows.length} brand${rows.length === 1 ? "" : "s"} · designer pages use hero, bio, and products`}
      />
      <AdminDrawer open={Boolean(editing)} title={editing === "new" ? "Add brand" : "Edit brand"} onClose={() => setEditing(null)}>
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
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Lookbook bio (designer page)</Label>
            <Textarea value={form.lookbookBio} onChange={(e) => setForm({ ...form, lookbookBio: e.target.value })} />
          </div>
          <AdminImageField
            label="Logo"
            value={form.logoUrl}
            onChange={(logoUrl) => setForm({ ...form, logoUrl })}
            folder="brands"
            hint="Square mark used in filters and designer lists."
          />
          <AdminImageField
            label="Hero image"
            value={form.heroImageUrl}
            onChange={(heroImageUrl) => setForm({ ...form, heroImageUrl })}
            folder="brands"
            hint="Wide photo for the designer page."
          />
          <div>
            <Label>SEO title</Label>
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </div>
          <div>
            <Label>SEO description</Label>
            <Textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>ACTIVE</option>
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
