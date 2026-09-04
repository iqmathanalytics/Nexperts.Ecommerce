"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { ProductCommerceDetails } from "@/components/store/ProductCommerceDetails";
import { formatINR } from "@/lib/utils";
import type { StoreProduct } from "@/lib/productFetch";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { BackButton } from "@/components/store/BackButton";
import { addGuestCartItem } from "@/lib/guestCart";

export function ProductPageClient({ slug, initial }: { slug: string; initial: StoreProduct | null }) {
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
    queryFn: () => api<StoreProduct>(`/products/${slug}`),
    initialData: initial ? { data: initial } : undefined,
    staleTime: 60_000,
  });
  const product = data?.data;
  const relatedItems = (product?.related ?? []).filter((p) => p.slug !== slug).slice(0, 8);
  const fit = product?.fit;
  const viewers = product?.presence?.viewers ?? 0;
  const ugc = product?.ugc ?? [];

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
    onMutate: () => {
      pulseCart();
      openMiniCart();
    },
    onSuccess: (result) => {
      qc.setQueryData(["cart"], result);
      push("Added to bag");
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
      void qc.invalidateQueries({ queryKey: ["wishlist"] });
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

  function addToBagAsGuest() {
    if (!product || !variant) return;
    const sizeLabel = variant.attributes?.size ?? variant.attributes?.Size ?? variant.name;
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
  }

  if (isLoading && !product) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2 md:px-6">
        <Skeleton className="aspect-[2/3] w-full" />
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-ink md:px-6">
      <div className="mb-4">
        <BackButton fallback="/products" tone="dark" />
      </div>
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/products" },
          ...(product.brand ? [{ label: product.brand.name, href: `/designers/${product.brand.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div className="lg:sticky lg:top-[calc(var(--store-chrome)+1rem)] lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            {product.brand?.name}
            {product.gender ? ` ┬╖ ${product.gender === "UNISEX" ? "Unisex" : product.gender === "MEN" ? "Men" : "Women"}` : ""}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {product.reviewCount > 0 ? (
              <>
                <StarRating value={product.rating} />
                <span className="text-sm text-muted">
                  {product.rating.toFixed(1)} ┬╖ {product.reviewCount} reviews
                </span>
              </>
            ) : (
              <span className="text-sm text-muted">New arrival</span>
            )}
            {fit?.label ? <FitFeedbackChip fit={fit.label.includes("small") ? "SMALL" : fit.label.includes("large") ? "LARGE" : "TRUE"} /> : null}
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
                      v.id === variant.id ? "btn-chip-active" : "border-line hover:border-ink disabled:opacity-40"
                    }`}
                  >
                    {sizeLabel}
                    <span className="mt-0.5 block text-[10px] opacity-70">{v.inStock ? `${v.available}` : "ΓÇö"}</span>
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
                <Button disabled={!waitlistEmail || waitlist.isPending} pending={waitlist.isPending} onClick={() => waitlist.mutate()}>
                  {waitlist.isPending ? "Joining…" : "Notify me"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySpinner value={qty} max={Math.max(1, variant.available)} onChange={setQty} />
            <Button
              className="min-w-40"
              disabled={!variant.inStock}
              pending={addCart.isPending}
              onClick={() => {
                if (addCart.isPending) return;
                if (!isAuthenticated) {
                  addToBagAsGuest();
                  return;
                }
                addCart.mutate();
              }}
            >
              {addCart.isPending ? "Adding…" : "Add to bag"}
            </Button>
            <Button
              variant="brand"
              disabled={!variant.inStock}
              pending={addCart.isPending}
              onClick={() => {
                if (addCart.isPending) return;
                if (!isAuthenticated) {
                  addToBagAsGuest();
                  router.push(loginUrl("/checkout"));
                  return;
                }
                void addCart.mutateAsync();
                router.push("/checkout");
              }}
            >
              Buy now
            </Button>
            <motion.div whileTap={{ scale: 0.92 }}>
              <Button
                variant="outline"
                size="icon"
                pending={wish.isPending}
                onClick={() => {
                  if (wish.isPending) return;
                  requireSignIn() && wish.mutate();
                }}
                aria-label={wishItem ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-5 w-5 ${wishItem ? "fill-ink text-ink" : ""}`} />
              </Button>
            </motion.div>
          </div>

          <ProductCommerceDetails
            specifications={product.specifications}
            shippingInfo={product.shippingInfo}
            returnInfo={product.returnInfo}
            sku={variant.sku}
            commerce={product.commerce}
          />
        </div>
      </div>

      {ugc.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl font-semibold">Worn by you</h2>
          <div className="mt-6 flex gap-3 overflow-x-auto">
            {ugc.map((u) => (
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
        <ProductGrid products={relatedItems} />
      </section>

      <SizeGuideModal
        open={sizeOpen}
        onClose={() => setSizeOpen(false)}
        brandName={product.brand?.name}
        fitHint={fit?.label ? `Customers say this ${fit.label.toLowerCase()}.` : null}
      />
    </div>
  );
}
