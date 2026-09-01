"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Toast } from "@/components/ui/state";

type Variant = { id?: number; sku: string; name: string; price: number; mrp: number; stock?: number; isDefault?: boolean; attributes?: Record<string, string> };

export default function ProductEditor({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PUBLISHED");
  const [gender, setGender] = useState("WOMEN");
  const [brandId, setBrandId] = useState<number | "">("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [specifications, setSpecifications] = useState("{\"Material\":\"Premium\"}");
  const [shippingInfo, setShippingInfo] = useState("Ships in 2-5 days");
  const [returnInfo, setReturnInfo] = useState("7-day returns");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [variants, setVariants] = useState<Variant[]>(
    mode === "create"
      ? ["S", "M", "L", "XL"].map((size, i) => ({ sku: "", name: size, price: 0, mrp: 0, stock: 12, isDefault: i === 0, attributes: { size } }))
      : [{ sku: "", name: "S", price: 0, mrp: 0, stock: 0, isDefault: true }],
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
    setDescription(p.description ?? "");
    setStatus(p.status);
    setGender(p.gender ?? "UNISEX");
    setBrandId(p.brandId ?? "");
    setCategoryIds(p.categoryIds ?? []);
    setSeoTitle(p.seoTitle ?? "");
    setSeoDescription(p.seoDescription ?? "");
    setSpecifications(JSON.stringify(p.specifications ?? {}));
    setShippingInfo(p.shippingInfo ?? "Ships in 2-5 days");
    setReturnInfo(p.returnInfo ?? "7-day returns");
    setIsFeatured(Boolean(p.isFeatured));
    setIsNew(Boolean(p.isNew));
    setVariants(p.variants.map((v: any) => ({ id: v.id, sku: v.sku, name: v.name, price: Number(v.price), mrp: Number(v.mrp), stock: v.inventory?.stock ?? 0, isDefault: v.isDefault, attributes: v.attributes })));
  }, [existing.data]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name,
        description,
        status,
        gender,
        brandId: brandId === "" ? null : Number(brandId),
        categoryIds,
        seoTitle,
        seoDescription,
        specifications: JSON.parse(specifications || "{}"),
        shippingInfo,
        returnInfo,
        isFeatured,
        isNew,
        variants: variants.map((v, i) => ({ ...v, price: Number(v.price), mrp: Number(v.mrp), stock: Number(v.stock ?? 0), isDefault: i === 0 })),
      };
      return mode === "create"
        ? api("/admin/products", { method: "POST", body: JSON.stringify(body) })
        : api(`/admin/products/${params.id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: (res: any) => {
      setMsg("Saved");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      if (mode === "create") router.push(`/admin/products/${res.data.id}`);
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));
      return api(`/admin/products/${params.id}/images`, { method: "POST", body: fd });
    },
    onSuccess: () => { setMsg("Images uploaded"); existing.refetch(); },
  });

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">{mode === "create" ? "Create product" : "Edit product"}</h1>
      {msg && <Toast message={msg} />}
      {status !== "PUBLISHED" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Not visible on the storefront</p>
          <p className="mt-1 text-amber-900">
            Set status to <strong>PUBLISHED</strong> for this product to appear in the shop, search, and category pages.
          </p>
        </div>
      )}
      <div className="grid gap-3 rounded-xl bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><Label>Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option>
          </Select>
        </div>
        <div><Label>Gender</Label>
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="UNISEX">Unisex</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </Select>
        </div>
        <div><Label>Brand</Label>
          <Select value={String(brandId)} onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">None</option>
            {(brands.data?.data ?? []).filter((b) => (b.status ?? "ACTIVE") === "ACTIVE").map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2"><Label>SEO title</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></div>
        <div className="md:col-span-2"><Label>SEO description</Label><Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Specifications JSON</Label><Textarea value={specifications} onChange={(e) => setSpecifications(e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Shipping info</Label><Textarea value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Returns info</Label><Textarea value={returnInfo} onChange={(e) => setReturnInfo(e.target.value)} /></div>
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
            {(cats.data?.data ?? []).filter((c) => (c.status ?? "ACTIVE") === "ACTIVE").map((c) => (
              <label key={c.id} className="text-sm"><input type="checkbox" checked={categoryIds.includes(c.id)} onChange={(e) => setCategoryIds((ids) => e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id))} /> {c.name}</label>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-white p-5">
        <p className="mb-3 font-medium">Sizes / SKU / inventory</p>
        {variants.map((v, i) => (
          <div key={i} className="mb-3 grid gap-2 md:grid-cols-5">
            <Input placeholder="SKU" value={v.sku} onChange={(e) => setVariants(edit(variants, i, { sku: e.target.value }))} />
            <Input placeholder="Name" value={v.name} onChange={(e) => setVariants(edit(variants, i, { name: e.target.value }))} />
            <Input type="number" placeholder="Price" value={v.price} onChange={(e) => setVariants(edit(variants, i, { price: Number(e.target.value) }))} />
            <Input type="number" placeholder="MRP" value={v.mrp} onChange={(e) => setVariants(edit(variants, i, { mrp: Number(e.target.value) }))} />
            <Input type="number" placeholder="Stock" value={v.stock ?? 0} onChange={(e) => setVariants(edit(variants, i, { stock: Number(e.target.value) }))} />
          </div>
        ))}
        <Button variant="outline" type="button" onClick={() => setVariants([...variants, { sku: "", name: "XL", price: variants[0]?.price ?? 0, mrp: variants[0]?.mrp ?? 0, stock: 0 }])}>Add size</Button>
      </div>
      {mode === "edit" && (
        <div className="rounded-xl bg-white p-5">
          <p className="mb-2 font-medium">Images</p>
          <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && upload.mutate(e.target.files)} />
          <div className="mt-3 flex gap-2">
            {(existing.data?.data.images ?? []).map((img: any) => (
              <div key={img.id} className="relative">
                <img src={img.url} alt="" className="h-20 w-20 rounded object-cover" />
                <button className="absolute right-0 top-0 bg-white text-xs" onClick={() => api(`/admin/images/${img.id}`, { method: "DELETE" }).then(() => existing.refetch())}>x</button>
                <button className="block text-xs" onClick={() => api(`/admin/images/${img.id}/primary`, { method: "POST" }).then(() => existing.refetch())}>Primary</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button onClick={() => save.mutate()} disabled={save.isPending}>Save product</Button>
    </div>
  );
}

function edit(list: Variant[], i: number, patch: Partial<Variant>) {
  return list.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
}
