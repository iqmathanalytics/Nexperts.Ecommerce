"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { QuantitySpinner, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { ScarcityBanner } from "@/components/store/ScarcityBanner";

type Variant = {
  id: number;
  attributes: Record<string, string> | null;
  price: number;
  mrp: number;
  available: number;
  inStock: boolean;
  isDefault: boolean;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  brand: { name: string; slug: string } | null;
  images: Array<{ id: number; url: string; isPrimary: boolean }>;
  variants: Variant[];
};

export function QuickViewModal({
  open,
  onClose,
  productSlug,
}: {
  open: boolean;
  onClose: () => void;
  productSlug: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { push } = useToast();
  const { openMiniCart, pulseCart } = useStoreUi();
  const { isAuthenticated } = useSession();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productSlug],
    queryFn: () => api<Product>(`/products/${productSlug}`),
    enabled: open,
  });
  const product = data?.data;
  const variant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === (variantId ?? product.variants.find((x) => x.isDefault)?.id)) ?? product.variants[0];
  }, [product, variantId]);

  const add = useMutation({
    mutationFn: () => api("/cart/items", { method: "POST", body: JSON.stringify({ variantId: variant!.id, quantity: qty }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      push("Added to bag");
      pulseCart();
      openMiniCart();
      onClose();
    },
    onError: (e: Error) => {
      if (e instanceof ApiRequestError && e.status === 401) {
        router.push(loginUrl(`/products/${productSlug}`));
        return;
      }
      push(e.message, "error");
    },
  });

  const sizes = (product?.variants ?? []).map((v) => ({
    id: v.id,
    label: v.attributes?.size ?? v.attributes?.Size ?? "One size",
    available: v.available,
    inStock: v.inStock,
  }));

  return (
    <Modal open={open} onClose={onClose} title={product?.name ?? "Quick view"} size="xl">
      {isLoading || !product ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
              {product.images[imgIdx] ? (
                <Image src={product.images[imgIdx].url} alt="" fill className="object-cover object-top" sizes="(max-width:768px) 100vw, 40vw" />
              ) : null}
            </div>
            {product.images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    className={`relative h-16 w-12 shrink-0 overflow-hidden border ${i === imgIdx ? "border-ink" : "border-line"}`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover object-top" sizes="48px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{product.brand?.name ?? "Nexperts"}</p>
            <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight">{product.name}</h3>
            {variant ? (
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-lg font-semibold">{formatINR(variant.price)}</span>
                {variant.mrp > variant.price ? <span className="text-sm text-muted line-through">{formatINR(variant.mrp)}</span> : null}
              </div>
            ) : null}

            {variant && variant.available > 0 && variant.available <= 5 ? <ScarcityBanner available={variant.available} className="mt-4" /> : null}

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.inStock}
                    onClick={() => setVariantId(s.id)}
                    className={`min-w-12 border px-3 py-2 text-sm transition ${
                      variant?.id === s.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink disabled:opacity-40"
                    }`}
                  >
                    {s.label}
                    <span className="mt-0.5 block text-[10px] opacity-70">{s.inStock ? `${s.available} left` : "Out"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantitySpinner value={qty} onChange={setQty} max={variant?.available ?? 10} />
              <Button
                className="flex-1"
                disabled={!variant?.inStock || add.isPending}
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push(loginUrl(`/products/${productSlug}`));
                    return;
                  }
                  add.mutate();
                }}
              >
                {add.isPending ? "Adding…" : "Add to bag"}
              </Button>
            </div>

            <Link href={`/products/${product.slug}`} onClick={onClose} className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
              View full details
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
