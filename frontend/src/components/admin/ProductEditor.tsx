"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";

type Variant = {
  id?: number;
  sku: string;
  name: string;
  price: number;
  mrp: number;
  stock?: number;
  reorderLevel?: number;
  isDefault?: boolean;
  attributes?: Record<string, string>;
};

type SpecRow = { key: string; value: string };

const SPEC_KEYS = ["Material", "Care", "Styling", "Model"] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function makeSku(productName: string, size: string, index: number) {
  const base = slugify(productName) || "sku";
  return `${base}-${slugify(size) || index + 1}`.toUpperCase().slice(0, 80);
}

function specsFromProduct(raw: Record<string, string> | null | undefined): SpecRow[] {
  const src = raw ?? {};
  const rows: SpecRow[] = SPEC_KEYS.map((key) => ({ key, value: src[key] ?? "" }));
  for (const [key, value] of Object.entries(src)) {
    if (!SPEC_KEYS.includes(key as (typeof SPEC_KEYS)[number])) rows.push({ key, value });
  }
  return rows;
}

function specsToRecord(rows: SpecRow[]) {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (row.key.trim() && row.value.trim()) out[row.key.trim()] = row.value.trim();
  }
  return out;
}

export default function ProductEditor({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PUBLISHED");
  const [gender, setGender] = useState("WOMEN");
  const [brandId, setBrandId] = useState<number | "">("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [specRows, setSpecRows] = useState<SpecRow[]>(specsFromProduct({ Material: "Premium" }));
  const [shippingInfo, setShippingInfo] = useState("Ships in 2-5 days");
  const [returnInfo, setReturnInfo] = useState("7-day returns");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [variants, setVariants] = useState<Variant[]>(
    mode === "create"
      ? ["S", "M", "L", "XL"].map((size, i) => ({
          sku: "",
          name: size,
          price: 0,
          mrp: 0,
          stock: 12,
          reorderLevel: 5,
          isDefault: i === 0,
          attributes: { size },
        }))
      : [{ sku: "", name: "S", price: 0, mrp: 0, stock: 0, reorderLevel: 5, isDefault: true, attributes: { size: "S" } }],
  );
  const brands = useQuery({ queryKey: ["admin-brands"], queryFn: () => api<Array<{ id: number; name: string; status?: string }>>("/admin/brands") });
  const cats = useQuery({ queryKey: ["admin-cats"], queryFn: () => api<Array<{ id: number; name: string; status?: string }>>("/admin/categories") });
  const existing = useQuery({
    queryKey: ["admin-product", params.id],
    queryFn: () => api<any>(`/admin/products/${params.id}`),
    enabled: mode === "edit" && Boolean(params.id),
  });

  useEffect(() => {
    const p = existing.data?.data;
    if (!p) return;
    setName(p.name);
    setSlug(p.slug ?? "");
    setDescription(p.description ?? "");
    setStatus(p.status);
    setGender(p.gender ?? "UNISEX");
    setBrandId(p.brandId ?? "");
    setCategoryIds(p.categoryIds ?? []);
    setSeoTitle(p.seoTitle ?? "");
    setSeoDescription(p.seoDescription ?? "");
    setSpecRows(specsFromProduct(p.specifications));
    setShippingInfo(p.shippingInfo ?? "Ships in 2-5 days");
    setReturnInfo(p.returnInfo ?? "7-day returns");
    setIsFeatured(Boolean(p.isFeatured));
    setIsNew(Boolean(p.isNew));
    setVariants(
      p.variants.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: Number(v.price),
        mrp: Number(v.mrp),
        stock: v.inventory?.stock ?? 0,
        reorderLevel: v.inventory?.reorderLevel ?? 5,
        isDefault: v.isDefault,
        attributes: v.attributes ?? { size: v.name },
      })),
    );
  }, [existing.data]);

  function payload() {
    return {
      name,
      slug: slug.trim() || undefined,
      description,
      status,
      gender,
      brandId: brandId === "" ? null : Number(brandId),
      categoryIds,
      seoTitle,
      seoDescription,
      specifications: specsToRecord(specRows),
      shippingInfo,
      returnInfo,
      isFeatured,
      isNew,
      variants: variants.map((v, i) => {
        const size = v.attributes?.size || v.name;
        return {
          ...v,
          sku: v.sku.trim() || makeSku(name, size, i),
          attributes: { ...(v.attributes ?? {}), size },
          price: Number(v.price),
          mrp: Number(v.mrp),
          stock: Number(v.stock ?? 0),
          reorderLevel: Number(v.reorderLevel ?? 5),
          isDefault: Boolean(v.isDefault) || i === 0,
        };
      }),
    };
  }

  const save = useMutation({
    mutationFn: () => {
      const body = payload();
      if (!body.name.trim()) throw new Error("Name is required");
      if (body.variants.some((v) => !v.price || !v.mrp)) throw new Error("Each size needs a price and MRP");
      return mode === "create"
        ? api("/admin/products", { method: "POST", body: JSON.stringify(body) })
        : api(`/admin/products/${params.id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: (res: any) => {
      setErr(null);
      setMsg("Saved — published products appear on the storefront immediately.");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", params.id] });
      if (mode === "create") router.push(`/admin/products/${res.data.id}`);
    },
    onError: (e: Error) => {
      setMsg(null);
      setErr(e.message);
    },
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));
      return api(`/admin/products/${params.id}/images`, { method: "POST", body: fd });
    },
    onSuccess: () => {
      setMsg("Images uploaded. The first is the card image; the second is the hover image.");
      existing.refetch();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const archive = useMutation({
    mutationFn: () => api(`/admin/products/${params.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      router.push("/admin/products");
    },
    onError: (e: Error) => setErr(e.message),
  });

  const restore = useMutation({
    mutationFn: () => api(`/admin/products/${params.id}/status`, { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }),
    onSuccess: () => {
      setStatus("PUBLISHED");
      setMsg("Restored to the storefront");
      existing.refetch();
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const duplicate = useMutation({
    mutationFn: () => api<any>(`/admin/products/${params.id}/duplicate`, { method: "POST" }),
    onSuccess: (res) => router.push(`/admin/products/${res.data.id}`),
    onError: (e: Error) => setErr(e.message),
  });

  const images: Array<{ id: number; url: string; isPrimary: boolean; alt?: string }> = existing.data?.data.images ?? [];

  async function reorder(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = images.slice();
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    await api(`/admin/products/${params.id}/images/reorder`, {
      method: "POST",
      body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
    });
    existing.refetch();
  }

  return (
    <div className="max-w-4xl space-y-4 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{mode === "create" ? "Create product" : "Edit product"}</h1>
        {mode === "edit" ? (
          <div className="flex flex-wrap gap-2">
            {existing.data?.data.slug ? (
              <Link href={`/products/${existing.data.data.slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">
                View on store
              </Link>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => duplicate.mutate()} disabled={duplicate.isPending}>
              Duplicate
            </Button>
            {status === "ARCHIVED" ? (
              <Button size="sm" onClick={() => restore.mutate()} disabled={restore.isPending}>
                Restore to store
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm("Remove this product from the shop? You can restore it later from Archived.")) archive.mutate();
                }}
                disabled={archive.isPending}
              >
                Delete
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {msg && <Toast message={msg} />}
      {err && <Toast message={err} tone="error" />}
      {status !== "PUBLISHED" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Not visible on the storefront</p>
          <p className="mt-1 text-amber-900">
            Set status to <strong>PUBLISHED</strong> for this product to appear in the shop, search, and category pages.
          </p>
        </div>
      )}
      <div className="grid gap-3 rounded-2xl border border-line bg-surface-raised p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (mode === "create") setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="md:col-span-2">
          <Label>URL slug</Label>
          <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="auto from name" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>DRAFT</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </Select>
        </div>
        <div>
          <Label>Gender</Label>
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="UNISEX">Unisex</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </Select>
        </div>
        <div>
          <Label>Brand</Label>
          <Select value={String(brandId)} onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : "")}>
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
        <div className="md:col-span-2">
          <Label>SEO title</Label>
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>SEO description</Label>
          <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>Product details (shown on the product page)</Label>
          {specRows.map((row, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="Label (e.g. Material)"
                value={row.key}
                onChange={(e) => setSpecRows(specRows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))}
              />
              <Textarea
                className="md:col-span-2 min-h-16"
                placeholder={row.key === "Styling" ? "How to wear" : row.key === "Model" ? "Fit & model" : "Value"}
                value={row.value}
                onChange={(e) => setSpecRows(specRows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" type="button" onClick={() => setSpecRows([...specRows, { key: "", value: "" }])}>
            Add detail
          </Button>
          <p className="text-xs text-muted">Styling → “How to wear”. Model → “Fit & model”. Other rows appear under Composition & care.</p>
        </div>
        <div className="md:col-span-2">
          <Label>Shipping info</Label>
          <Textarea value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Returns info</Label>
          <Textarea value={returnInfo} onChange={(e) => setReturnInfo(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured on home
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          Mark as new arrival
        </label>
        <div className="md:col-span-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2">
            {(cats.data?.data ?? [])
              .filter((c) => (c.status ?? "ACTIVE") === "ACTIVE")
              .map((c) => (
                <label key={c.id} className="text-sm">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    onChange={(e) => setCategoryIds((ids) => (e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id)))}
                  />{" "}
                  {c.name}
                </label>
              ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface-raised p-5">
        <p className="mb-3 font-medium">Sizes / SKU / inventory</p>
        <p className="mb-3 text-xs text-muted">These sizes appear on the product page. Removing a size hides it from the shop.</p>
        {variants.map((v, i) => (
          <div key={v.id ?? i} className="mb-3 grid gap-2 rounded-xl border border-line p-3 md:grid-cols-7">
            <Input
              placeholder="Size"
              value={v.attributes?.size ?? v.name}
              onChange={(e) =>
                setVariants(edit(variants, i, { name: e.target.value, attributes: { ...v.attributes, size: e.target.value } }))
              }
            />
            <Input placeholder="SKU" value={v.sku} onChange={(e) => setVariants(edit(variants, i, { sku: e.target.value }))} />
            <Input type="number" placeholder="Price" value={v.price} onChange={(e) => setVariants(edit(variants, i, { price: Number(e.target.value) }))} />
            <Input type="number" placeholder="MRP" value={v.mrp} onChange={(e) => setVariants(edit(variants, i, { mrp: Number(e.target.value) }))} />
            <Input type="number" placeholder="Stock" value={v.stock ?? 0} onChange={(e) => setVariants(edit(variants, i, { stock: Number(e.target.value) }))} />
            <Input
              type="number"
              placeholder="Reorder"
              value={v.reorderLevel ?? 5}
              onChange={(e) => setVariants(edit(variants, i, { reorderLevel: Number(e.target.value) }))}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs">
                <input
                  type="radio"
                  name="default-variant"
                  checked={Boolean(v.isDefault)}
                  onChange={() => setVariants(variants.map((x, idx) => ({ ...x, isDefault: idx === i })))}
                />{" "}
                Default
              </label>
              {variants.length > 1 ? (
                <button type="button" className="text-xs text-danger" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              {
                sku: "",
                name: "XL",
                price: variants[0]?.price ?? 0,
                mrp: variants[0]?.mrp ?? 0,
                stock: 0,
                reorderLevel: 5,
                attributes: { size: "XL" },
              },
            ])
          }
        >
          Add size
        </Button>
      </div>
      {mode === "edit" && (
        <div className="rounded-2xl border border-line bg-surface-raised p-5">
          <p className="mb-2 font-medium">Images</p>
          <p className="mb-3 text-xs text-muted">
            First image is the product card. Second image is the hover swap on the shop. Drag order with the arrows.
          </p>
          <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && upload.mutate(e.target.files)} />
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.id} className="relative w-24">
                <img src={mediaUrl(img.url)} alt={img.alt ?? ""} className="h-24 w-24 rounded object-cover" />
                {i === 0 ? <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px]">Card</span> : null}
                {i === 1 ? <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px]">Hover</span> : null}
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <button type="button" onClick={() => reorder(i, i - 1)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => reorder(i, i + 1)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => api(`/admin/images/${img.id}/primary`, { method: "POST" }).then(() => existing.refetch())}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className="text-danger"
                    onClick={() => api(`/admin/images/${img.id}`, { method: "DELETE" }).then(() => existing.refetch())}
                  >
                    Delete
                  </button>
                </div>
                <input
                  className="mt-1 w-full rounded border border-line bg-surface px-1 py-0.5 text-[10px]"
                  placeholder="Alt text"
                  defaultValue={img.alt ?? ""}
                  onBlur={(e) => {
                    const alt = e.target.value;
                    if (alt === (img.alt ?? "")) return;
                    api(`/admin/images/${img.id}`, { method: "PATCH", body: JSON.stringify({ alt }) }).then(() => existing.refetch());
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Save product
      </Button>
    </div>
  );
}

function edit(list: Variant[], i: number, patch: Partial<Variant>) {
  return list.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
}
