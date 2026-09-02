"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { api, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Breadcrumbs,
  FitFeedbackChip,
  PageState,
  ProductCardSkeleton,
  QuantitySpinner,
  Skeleton,
  StarRating,
} from "@/components/ui/state";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductGrid } from "@/components/store/ProductCard";
import { ReviewForm, type ReviewEligible } from "@/components/store/ReviewForm";
import { SizeGuideModal } from "@/components/store/SizeGuideModal";
import { ScarcityBanner } from "@/components/store/ScarcityBanner";
import { formatINR } from "@/lib/utils";
import type { ProductCard } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { useStoreUi } from "@/components/store/StoreUiContext";

type Variant = {
  id: number;
  sku: string;
  name: string;
  attributes: Record<string, string> | null;
  price: number;
  mrp: number;
  discountPercent: number;
  available: number;
  inStock: boolean;
  isDefault: boolean;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  gender?: "MEN" | "WOMEN" | "UNISEX";
  description: string;
  sku?: string;
  specifications: Record<string, string> | null;
  shippingInfo: string | null;
  returnInfo: string | null;
  brand: { name: string; slug: string } | null;
  images: Array<{ id: number; url: string; isPrimary: boolean; variantId: number | null }>;
  variants: Variant[];
  rating: number;
  reviewCount: number;
  reviews: Array<{
    id: number;
    rating: number;
    title: string;
    comment: string;
    firstName: string;
    createdAt: string;
    fitFeedback?: string | null;
  }>;
  related: ProductCard[];
};

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { push } = useToast();
  const { openMiniCart, pulseCart } = useStoreUi();
  const { isAuthenticated } = useSession();
  const [qty, setQty] = useState(1);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [variantId, setVariantId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api<Product>(`/products/${slug}`),
  });
  const product = data?.data;

  const fit = useQuery({
    queryKey: ["fit", product?.id],
    queryFn: () =>
      api<{ small: number; true: number; large: number; label: string }>(`/products/${product!.id}/fit-data`).catch(() => ({
        data: { small: 0, true: 0, large: 0, label: "True to size" },
      })),
    enabled: Boolean(product?.id),
    retry: false,
  });

  const presence = useQuery({
    queryKey: ["presence", product?.id],
    queryFn: async () => {
      await api(`/products/${product!.id}/presence`, { method: "POST", body: "{}" }).catch(() => null);
      return api<{ viewers: number }>(`/products/${product!.id}/presence`).catch(() => ({ data: { viewers: 0 } }));
    },
    enabled: Boolean(product?.id),
    retry: false,
    refetchInterval: 30_000,
  });

  const ugc = useQuery({
    queryKey: ["ugc", product?.id],
    queryFn: () =>
      api<Array<{ id: number; imageUrl: string; caption: string | null }>>(`/products/${product!.id}/ugc`).catch(() => ({ data: [] })),
    enabled: Boolean(product?.id),
    retry: false,
  });

  const eligible = useQuery({
    queryKey: ["review-eligible", product?.id],
    queryFn: () => api<ReviewEligible[]>(`/reviews/eligible?productId=${product!.id}`),
    enabled: isAuthenticated && Boolean(product?.id),
  });
  const wishlist = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<{ items: Array<{ id: number; productId: number }> }>("/wishlist"),
    enabled: isAuthenticated,
    retry: false,
  });

  const variant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === (variantId ?? product.variants.find((x) => x.isDefault)?.id)) ?? product.variants[0];
  }, [product, variantId]);

  const wishItem = useMemo(
    () => (product ? (wishlist.data?.data.items ?? []).find((item) => item.productId === product.id) : undefined),
    [product, wishlist.data?.data.items],
  );

  useEffect(() => {
    setQty(1);
  }, [variant?.id]);

  const addCart = useMutation({
    mutationFn: () => api("/cart/items", { method: "POST", body: JSON.stringify({ variantId: variant!.id, quantity: qty }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      push("Added to bag");
      pulseCart();
      openMiniCart();
    },
    onError: (e: Error) => {
      if (e instanceof ApiRequestError && e.status === 401) {
        router.push(loginUrl(`/products/${slug}`));
        return;
      }
      push(e.message, "error");
    },
  });

  const wish = useMutation({
    mutationFn: async () => {
      if (wishItem) {
        await api(`/wishlist/items/${wishItem.id}`, { method: "DELETE" });
        return "removed" as const;
      }
      await api("/wishlist/items", { method: "POST", body: JSON.stringify({ productId: product!.id, variantId: variant?.id }) });
      return "saved" as const;
    },
    onSuccess: (action) => {
      push(action === "removed" ? "Removed from wishlist" : "Saved to wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: Error) => {
      if (e instanceof ApiRequestError && e.status === 401) {
        router.push(loginUrl(`/products/${slug}`));
        return;
      }
      push(e.message, "error");
    },
  });

  const waitlist = useMutation({
    mutationFn: () =>
      api("/waitlist", {
        method: "POST",
        body: JSON.stringify({ variantId: variant!.id, email: waitlistEmail }),
      }),
    onSuccess: () => push("We'll email you when it's back"),
    onError: (e: Error) => push(e.message, "error"),
  });

  function requireSignIn() {
    if (isAuthenticated) return true;
    router.push(loginUrl(`/products/${slug}`));
    return false;
  }

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2 md:px-6">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <ProductCardSkeleton />
        </div>
      </div>
    );
  }
  if (isError || !product || !variant) return <PageState title="Product not found" />;

  const viewers = presence.data?.data?.viewers ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-ink md:px-6">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/products" },
          ...(product.brand ? [{ label: product.brand.name, href: `/designers/${product.brand.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            {product.brand?.name}
            {product.gender ? ` · ${product.gender === "UNISEX" ? "Unisex" : product.gender === "MEN" ? "Men" : "Women"}` : ""}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {product.reviewCount > 0 ? (
              <>
                <StarRating value={product.rating} />
                <span className="text-sm text-muted">
                  {product.rating.toFixed(1)} · {product.reviewCount} reviews
                </span>
              </>
            ) : (
              <span className="text-sm text-muted">New arrival</span>
            )}
            {fit.data?.data?.label ? <FitFeedbackChip fit={fit.data.data.label.includes("small") ? "SMALL" : fit.data.data.label.includes("large") ? "LARGE" : "TRUE"} /> : null}
          </div>

          {viewers > 0 ? <p className="mt-3 text-xs text-muted">{viewers} people are looking at this</p> : null}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tracking-tight">{formatINR(variant.price)}</span>
            {variant.mrp > variant.price ? <span className="text-muted line-through">{formatINR(variant.mrp)}</span> : null}
            {variant.discountPercent > 0 ? (
              <span className="bg-brand-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-text">
                {variant.discountPercent}% off
              </span>
            ) : null}
          </div>

          <p className="mt-6 text-sm leading-7 text-muted">{product.description}</p>

          {variant.inStock && variant.available <= 5 ? <ScarcityBanner available={variant.available} className="mt-5" /> : null}

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Size</p>
              <button type="button" onClick={() => setSizeOpen(true)} className="text-[11px] font-semibold uppercase tracking-[0.14em] underline-offset-4 hover:underline">
                Size guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const sizeLabel = v.attributes?.size ?? v.attributes?.Size ?? v.name;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.inStock}
                    onClick={() => setVariantId(v.id)}
                    className={`min-w-14 border px-3 py-2 text-sm transition ${
                      v.id === variant.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink disabled:opacity-40"
                    }`}
                  >
                    {sizeLabel}
                    <span className="mt-0.5 block text-[10px] opacity-70">{v.inStock ? `${v.available}` : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!variant.inStock ? (
            <div className="mt-6 border border-line bg-surface p-4">
              <p className="text-sm font-medium">Join the waitlist</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Email"
                  className="h-11 flex-1 border border-line bg-background px-3 text-sm outline-none focus:border-ink"
                />
                <Button disabled={!waitlistEmail || waitlist.isPending} onClick={() => waitlist.mutate()}>
                  Notify me
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySpinner value={qty} max={Math.max(1, variant.available)} onChange={setQty} />
            <Button className="min-w-40" disabled={!variant.inStock || addCart.isPending} onClick={() => requireSignIn() && addCart.mutate()}>
              {addCart.isPending ? "Adding…" : "Add to bag"}
            </Button>
            <Button
              variant="brand"
              disabled={!variant.inStock || addCart.isPending}
              onClick={() => {
                if (!requireSignIn()) return;
                addCart.mutateAsync().then(() => router.push("/checkout")).catch(() => undefined);
              }}
            >
              Buy now
            </Button>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                disabled={wish.isPending}
                onClick={() => requireSignIn() && wish.mutate()}
                aria-label={wishItem ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-5 w-5 ${wishItem ? "fill-ink text-ink" : ""}`} />
              </Button>
            </motion.div>
          </div>

          <div className="mt-10 divide-y divide-line border-y border-line">
            <details className="group open:bg-transparent" open>
              <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Composition & care
              </summary>
              <dl className="space-y-2 pb-5 text-sm">
                {Object.entries(product.specifications ?? {})
                  .filter(([k]) => !["Styling", "Model"].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6">
                      <dt className="text-muted">{k}</dt>
                      <dd className="max-w-[60%] text-right">{v}</dd>
                    </div>
                  ))}
                {!Object.keys(product.specifications ?? {}).length ? (
                  <p className="text-muted">See product label for fabric details.</p>
                ) : null}
              </dl>
            </details>
            {product.specifications?.Styling ? (
              <details>
                <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  How to wear
                </summary>
                <p className="pb-5 text-sm leading-7 text-muted">{product.specifications.Styling}</p>
              </details>
            ) : null}
            {product.specifications?.Model ? (
              <details>
                <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Fit & model
                </summary>
                <p className="pb-5 text-sm leading-7 text-muted">{product.specifications.Model}. Use the size guide for body measurements.</p>
              </details>
            ) : null}
            <details>
              <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Shipping
              </summary>
              <p className="pb-5 text-sm leading-7 text-muted">{product.shippingInfo ?? "2–5 business days across India."}</p>
            </details>
            <details>
              <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Returns
              </summary>
              <p className="pb-5 text-sm leading-7 text-muted">{product.returnInfo ?? "7-day returns on unused items with tags."}</p>
            </details>
          </div>
        </div>
      </div>

      {(ugc.data?.data?.length ?? 0) > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl font-semibold">Worn by you</h2>
          <div className="mt-6 flex gap-3 overflow-x-auto">
            {ugc.data!.data.map((u) => (
              <div key={u.id} className="relative h-48 w-36 shrink-0 overflow-hidden bg-surface-muted">
                <Image src={u.imageUrl} alt={u.caption ?? ""} fill className="object-cover" sizes="144px" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold">Reviews</h2>
        {isAuthenticated && (eligible.data?.data?.length ?? 0) > 0 ? (
          <div className="mt-6 max-w-xl">
            <ReviewForm
              eligible={eligible.data!.data}
              productId={product.id}
              onSuccess={(m) => {
                push(m);
                eligible.refetch();
                qc.invalidateQueries({ queryKey: ["product", slug] });
              }}
              onError={(m) => push(m, "error")}
            />
          </div>
        ) : null}
        <div className="mt-8 space-y-3">
          {product.reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet.</p>
          ) : (
            product.reviews.map((r) => (
              <div key={r.id} className="border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating value={r.rating} />
                  {r.fitFeedback ? <FitFeedbackChip fit={r.fitFeedback} /> : null}
                </div>
                <p className="mt-3 font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-muted">{r.comment}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted">{r.firstName}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 font-display text-3xl font-semibold">You may also like</h2>
        <ProductGrid products={product.related} />
      </section>

      <SizeGuideModal
        open={sizeOpen}
        onClose={() => setSizeOpen(false)}
        brandName={product.brand?.name}
        fitHint={fit.data?.data?.label ? `Customers say this ${fit.data.data.label.toLowerCase()}.` : null}
      />
    </div>
  );
}
