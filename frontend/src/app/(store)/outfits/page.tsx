"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageState, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";
import type { ProductCard } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export default function OutfitBuilderPage() {
  const { push } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("My look");
  const [canvas, setCanvas] = useState<ProductCard[]>([]);

  const catalog = useQuery({
    queryKey: ["products-outfit"],
    queryFn: () => api<ProductCard[]>("/products?limit=24&sort=newest"),
  });

  const outfits = useQuery({
    queryKey: ["saved-outfits"],
    queryFn: () => api<Array<{ id: number; name: string; shareSlug: string }>>("/saved-outfits"),
    retry: false,
  });

  const save = useMutation({
    mutationFn: () =>
      api("/saved-outfits", {
        method: "POST",
        body: JSON.stringify({
          name,
          items: canvas.map((p, i) => ({ productId: p.id, variantId: p.variantId, sortOrder: i })),
        }),
      }),
    onSuccess: () => {
      push("Outfit saved");
      qc.invalidateQueries({ queryKey: ["saved-outfits"] });
    },
    onError: (e: Error) => push(e.message, "error"),
  });

  function add(p: ProductCard) {
    if (canvas.find((c) => c.id === p.id)) return;
    setCanvas((prev) => [...prev, p].slice(0, 6));
  }

  function remove(id: number) {
    setCanvas((prev) => prev.filter((p) => p.id !== id));
  }

  function share() {
    const text = `Check my Nexperts outfit: ${canvas.map((c) => c.name).join(", ")}`;
    const url = `https://www.pinterest.com/pin/create/button/?description=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  if (catalog.isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Studio</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Outfit builder</h1>
      <p className="mt-3 text-sm text-muted">Tap pieces to build a look. Save or share to Pinterest.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[28rem] border border-dashed border-line bg-surface-muted/40 p-4">
          {canvas.length === 0 ? (
            <div className="flex h-full min-h-[24rem] items-center justify-center text-sm text-muted">Add pieces from the catalog</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {canvas.map((p) => (
                <button key={p.id} type="button" onClick={() => remove(p.id)} className="relative aspect-[3/4] overflow-hidden bg-surface">
                  {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} fill className="object-cover object-top" sizes="200px" /> : null}
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] text-white">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Outfit name" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={!canvas.length || save.isPending} onClick={() => save.mutate()}>
              Save outfit
            </Button>
            <Button variant="outline" disabled={!canvas.length} onClick={share}>
              Share
            </Button>
          </div>

          {(outfits.data?.data?.length ?? 0) > 0 ? (
            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Saved</p>
              <ul className="mt-3 space-y-2">
                {outfits.data!.data.map((o) => (
                  <li key={o.id} className="border border-line px-3 py-2 text-sm">
                    {o.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : outfits.isError ? (
            <p className="mt-6 text-xs text-muted">Sign in to save outfits.</p>
          ) : null}
        </div>
      </div>

      <h2 className="mt-14 font-display text-3xl font-semibold">Catalog</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {(catalog.data?.data ?? []).map((p) => (
          <button key={p.id} type="button" onClick={() => add(p)} className="text-left">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
              {p.imageUrl ? <Image src={p.imageUrl} alt="" fill className="object-cover object-top" sizes="160px" /> : null}
            </div>
            <p className="mt-2 line-clamp-1 text-xs font-medium">{p.name}</p>
            <p className="text-xs text-muted">{formatINR(p.price)}</p>
          </button>
        ))}
      </div>
      {!catalog.data?.data?.length ? <PageState title="No products to build with" /> : null}
    </div>
  );
}
