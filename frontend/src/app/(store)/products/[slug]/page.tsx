"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageState, Spinner, Toast } from "@/components/ui/state";
import { ProductGrid } from "@/components/store/ProductCard";
import { ReviewForm, type ReviewEligible } from "@/components/store/ReviewForm";
import { formatINR } from "@/lib/utils";
import type { ProductCard } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import { loginUrl } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";

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
  reviews: Array<{ id: number; rating: number; title: string; comment: string; firstName: string; createdAt: string }>;
  related: ProductCard[];
};

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated } = useSession();
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api<Product>(`/products/${slug}`),
  });
  const product = data?.data;
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
  const [variantId, setVariantId] = useState<number | null>(null);
  const [activeImageId, setActiveImageId] = useState<number | null>(null);
  const variant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === (variantId ?? product.variants.find((x) => x.isDefault)?.id)) ?? product.variants[0];
  }, [product, variantId]);
  const image =
    product?.images.find((i) => i.id === activeImageId) ??
    product?.images.find((i) => i.variantId === variant?.id) ??
    product?.images.find((i) => i.isPrimary) ??
    product?.images[0];
  const wishItem = useMemo(
    () => (product ? (wishlist.data?.data.items ?? []).find((item) => item.productId === product.id) : undefined),
    [product, wishlist.data?.data.items],
  );
  const isWishlisted = Boolean(wishItem);

  const addCart = useMutation({
    mutationFn: () => api("/cart/items", { method: "POST", body: JSON.stringify({ variantId: variant!.id, quantity: qty }) }),
    onSuccess: () => { setMsg("Added to cart"); setErr(null); qc.invalidateQueries({ queryKey: ["cart"] }); },
    onError: (e: Error) => {
      if (e instanceof ApiRequestError && e.status === 401) {
        router.push(loginUrl(`/products/${slug}`));
        return;
      }
      setErr(e.message);
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
      setMsg(action === "removed" ? "Removed from wishlist" : "Saved to wishlist");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: Error) => {
      if (e instanceof ApiRequestError && e.status === 401) {
        router.push(loginUrl(`/products/${slug}`));
        return;
      }
      setErr(e.message);
    },
  });

  function requireSignIn() {
    if (isAuthenticated) return true;
    router.push(loginUrl(`/products/${slug}`));
    return false;
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (isError || !product || !variant) return <PageState title="Product not found" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-ink">
      {msg ? <div className="mb-4"><Toast message={msg} /></div> : null}
      {err ? <div className="mb-4"><Toast message={err} tone="error" /></div> : null}
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl bg-[#f0eee9]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={product.name}
                className="aspect-[3/4] w-full object-cover object-[center_top]"
              />
            ) : (
              <div className="aspect-[3/4]" />
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageId(img.id)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                    image?.id === img.id ? "border-ink" : "border-line opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover object-[center_top]" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            {product.brand?.name}
            {product.gender ? ` · ${product.gender === "UNISEX" ? "Unisex" : product.gender === "MEN" ? "Men" : "Women"}` : ""}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">
            SKU {variant.sku}
            {product.reviewCount > 0 ? ` · ${product.rating.toFixed(1)} ★ (${product.reviewCount} reviews)` : " · New arrival"}
          </p>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tracking-tight text-ink">{formatINR(variant.price)}</span>
            {variant.mrp > variant.price ? <span className="text-muted line-through">{formatINR(variant.mrp)}</span> : null}
            {variant.discountPercent > 0 ? (
              <span className="rounded-sm bg-brand-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                {variant.discountPercent}% off
              </span>
            ) : null}
          </div>
          <p className="mt-6 text-sm leading-7 text-muted">{product.description}</p>
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    v.id === variant.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <p className={`mt-4 text-sm ${variant.inStock ? "text-emerald-700" : "text-red-600"}`}>
            {variant.inStock ? `${variant.available} in stock` : "Out of stock"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border border-line">
              <button
                type="button"
                className="px-3 py-2 disabled:opacity-40"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-8 text-center">{qty}</span>
              <button
                type="button"
                className="px-3 py-2 disabled:opacity-40"
                disabled={!variant.inStock || qty >= variant.available}
                onClick={() => setQty((q) => Math.min(variant.available, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <Button disabled={!variant.inStock || addCart.isPending} onClick={() => requireSignIn() && addCart.mutate()}>
              {addCart.isPending ? "Adding…" : "Add to cart"}
            </Button>
            <Button
              variant="secondary"
              disabled={!variant.inStock || addCart.isPending}
              onClick={() => {
                if (!requireSignIn()) return;
                addCart.mutateAsync().then(() => router.push("/checkout")).catch(() => undefined);
              }}
            >
              Buy now
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={wish.isPending}
              onClick={() => requireSignIn() && wish.mutate()}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-ink text-ink" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold text-ink">Specifications</h2>
          <dl className="mt-3 space-y-1 text-sm">
            {Object.entries(product.specifications ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-ink">{v}</dd></div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold text-ink">Shipping</h2>
          <p className="mt-3 text-sm text-muted">{product.shippingInfo}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold text-ink">Returns</h2>
          <p className="mt-3 text-sm text-muted">{product.returnInfo}</p>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold text-ink">Reviews</h2>
        {isAuthenticated && (eligible.data?.data?.length ?? 0) > 0 ? (
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-medium text-ink">Write a review</h3>
            <ReviewForm
              eligible={eligible.data!.data}
              productId={product.id}
              onSuccess={(m) => { setMsg(m); setErr(null); eligible.refetch(); qc.invalidateQueries({ queryKey: ["product", slug] }); }}
              onError={setErr}
            />
          </div>
        ) : isAuthenticated ? (
          <p className="mb-6 text-sm text-muted">You can review this product after it is delivered from your order.</p>
        ) : (
          <p className="mb-6 text-sm text-muted">
            <button type="button" className="text-ink font-semibold hover:underline" onClick={() => router.push(loginUrl(`/products/${slug}`))}>
              Sign in
            </button>{" "}
            to review products you purchased.
          </p>
        )}
        {product.reviews.length === 0 ? <p className="text-sm text-muted">No reviews yet.</p> : (
          <div className="space-y-3">
            {product.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-white p-4">
                <p className="font-medium">{r.title} · {r.rating}/5</p>
                <p className="mt-1 text-sm text-muted">{r.comment}</p>
                <p className="mt-2 text-xs text-muted">{r.firstName}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mt-12">
        <h2 className="mb-4 font-serif text-2xl">Related products</h2>
        <ProductGrid products={product.related} />
      </section>
    </div>
  );
}
