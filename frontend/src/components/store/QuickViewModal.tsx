"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { QuantitySpinner, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { ScarcityBanner } from "@/components/store/ScarcityBanner";
import { ProductCommerceDetails } from "@/components/store/ProductCommerceDetails";
import { addGuestCartItem } from "@/lib/guestCart";

type Variant = {
  id: number;
  sku?: string;
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
  description?: string | null;
  specifications?: Record<string, string> | null;
  shippingInfo?: string | null;
  returnInfo?: string | null;
  brand: { name: string; slug: string } | null;
  images: Array<{ id: number; url: string; isPrimary: boolean }>;
  variants: Variant[];
};

export type QuickViewPreview = {
  name: string;
  brandName?: string | null;
  imageUrl?: string | null;
  price: number;
  mrp: number;
};

export function QuickViewModal({
  open,
  onClose,
  productSlug,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  productSlug: string;
  preview?: QuickViewPreview;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { push } = useToast();
  const { openMiniCart, pulseCart } = useStoreUi();
  const { isAuthenticated } = useSession();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["product", productSlug, "lite"],
    queryFn: () => api<Product>(`/products/${productSlug}?lite=1`),
    enabled: open,
    staleTime: 60_000,
  });
  const product = data?.data;
  const variant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === (variantId ?? product.variants.find((x) => x.isDefault)?.id)) ?? product.variants[0];
  }, [product, variantId]);

  const add = useMutation({
    mutationFn: () => api("/cart/items", { method: "POST", body: JSON.stringify({ variantId: variant!.id, quantity: qty }) }),
    onMutate: () => {
      pulseCart();
      openMiniCart();
      onClose();
    },
    onSuccess: (result) => {
      qc.setQueryData(["cart"], result);
      push("Added to bag");
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

  const name = product?.name ?? preview?.name ?? "Quick view";
  const brandName = product?.brand?.name ?? preview?.brandName ?? "Nexperts";
  const price = variant?.price ?? preview?.price;
  const mrp = variant?.mrp ?? preview?.mrp ?? 0;
  const images =
    product?.images?.length
      ? product.images
      : preview?.imageUrl
        ? [{ id: 0, url: preview.imageUrl, isPrimary: true }]
        : [];
  const activeImage = images[imgIdx] ?? images[0];

  return (
    <Modal open={open} onClose={onClose} title={name} size="xl">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt=""
                fill
                priority
                quality={60}
                sizes="(max-width:768px) 90vw, 420px"
                className="object-cover object-top"
              />
            ) : isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`relative h-16 w-12 shrink-0 overflow-hidden border ${i === imgIdx ? "border-ink" : "border-line"}`}
                >
                  <Image src={img.url} alt="" fill quality={50} sizes="48px" className="object-cover object-top" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{brandName}</p>
          <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight">{name}</h3>
          {price != null ? (
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-lg font-semibold">{formatMoney(price)}</span>
              {mrp > price ? <span className="text-sm text-muted line-through">{formatMoney(mrp)}</span> : null}
            </div>
          ) : (
            <Skeleton className="mt-4 h-7 w-24" />
          )}

          {variant && variant.available > 0 && variant.available <= 5 ? <ScarcityBanner available={variant.available} className="mt-4" /> : null}

          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Size</p>
            {isError && !product ? (
              <p className="mt-3 text-sm text-danger">
                {error instanceof Error ? error.message : "Couldn’t load sizes. Open the product page to continue."}
              </p>
            ) : isLoading && !product ? (
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-12 w-14" />
                <Skeleton className="h-12 w-14" />
                <Skeleton className="h-12 w-14" />
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.inStock}
                    onClick={() => setVariantId(s.id)}
                    className={`min-w-12 border px-3 py-2 text-sm transition ${
                      variant?.id === s.id ? "btn-chip-active" : "border-line hover:border-ink disabled:opacity-40"
                    }`}
                  >
                    {s.label}
                    <span className="mt-0.5 block text-[10px] opacity-70">{s.inStock ? `${s.available} left` : "Out"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySpinner value={qty} onChange={setQty} max={variant?.available ?? 10} />
            <Button
              className="flex-1"
              disabled={!variant?.inStock}
              pending={add.isPending}
              onClick={() => {
                if (!product || !variant || add.isPending) return;
                if (!isAuthenticated) {
                  const sizeLabel = variant.attributes?.size ?? variant.attributes?.Size;
                  addGuestCartItem({
                    variantId: variant.id,
                    quantity: qty,
                    productName: product.name,
                    price: variant.price,
                    imageUrl: product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url ?? null,
                    slug: product.slug,
                    size: typeof sizeLabel === "string" ? sizeLabel : undefined,
                  });
                  push("Added to bag");
                  pulseCart();
                  openMiniCart();
                  onClose();
                  return;
                }
                add.mutate();
              }}
            >
              {add.isPending ? "Adding…" : "Add to bag"}
            </Button>
          </div>

          {product ? (
            <ProductCommerceDetails
              compact
              description={product.description}
              specifications={product.specifications}
              shippingInfo={product.shippingInfo}
              returnInfo={product.returnInfo}
              sku={variant?.sku}
            />
          ) : null}

          <Link
            href={`/products/${productSlug}`}
            prefetch
            onClick={() => onClose()}
            className="btn-store mt-6 inline-block text-xs font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline"
          >
            View full details
          </Link>
        </div>
      </div>
    </Modal>
  );
}
