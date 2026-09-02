"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { PageState, ProductCardSkeleton } from "@/components/ui/state";
import type { ProductCard } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export default function VisualSearchPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<ProductCard[]>([]);
  const { push } = useToast();

  const search = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return api<{ products: ProductCard[]; note?: string }>("/products/visual-search", { method: "POST", body: fd });
    },
    onSuccess: (res) => {
      setResults(res.data.products ?? (res.data as unknown as ProductCard[]) ?? []);
      if (res.data.note) push(res.data.note, "info");
    },
    onError: async (e: Error, file) => {
      // Fallback: JSON body with data URL if multipart unsupported
      try {
        const dataUrl = await fileToDataUrl(file);
        const res = await api<ProductCard[] | { products: ProductCard[] }>("/products/visual-search", {
          method: "POST",
          body: JSON.stringify({ imageUrl: dataUrl }),
        });
        const products = Array.isArray(res.data) ? res.data : res.data.products;
        setResults(products ?? []);
      } catch {
        push(e.message, "error");
      }
    },
  });

  function onFile(file: File | null) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    search.mutate(file);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Visual search</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Find similar pieces</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">Upload an outfit photo — we&apos;ll match catalog items.</p>

      <label className="mt-10 flex cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-surface px-6 py-16 transition hover:border-ink">
        <Upload className="h-8 w-8 text-muted" />
        <span className="mt-4 text-sm font-medium">Drop an image or browse</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {preview ? (
        <div className="relative mt-8 h-48 w-36 overflow-hidden bg-surface-muted">
          <Image src={preview} alt="Upload preview" fill className="object-cover" sizes="144px" />
        </div>
      ) : null}

      {search.isPending ? (
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-display text-3xl font-semibold">Matches</h2>
          <div className="mt-6">
            <ProductGrid products={results} />
          </div>
        </div>
      ) : search.isSuccess && !search.isPending ? (
        <PageState title="No close matches">
          <Link href="/products" className="underline">
            Browse all clothing
          </Link>
        </PageState>
      ) : null}

      <div className="mt-10">
        <Button variant="outline" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
          Try another image
        </Button>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
