"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { QuickViewModal } from "@/components/store/QuickViewModal";

export function ProductCard({
  product,
  secondaryImageUrl,
  onWishlist,
  wishlisted,
  dense,
}: {
  product: ProductCardType;
  secondaryImageUrl?: string | null;
  onWishlist?: () => void;
  wishlisted?: boolean;
  dense?: boolean;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [hoverReady, setHoverReady] = useState(false);
  const hoverSrc = secondaryImageUrl || product.hoverImageUrl || null;
  const canHoverSwap = Boolean(hoverSrc && hoverSrc !== product.imageUrl);

  return (
    <>
      <article className="group relative" onMouseEnter={() => canHoverSwap && setHoverReady(true)}>
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
          <span className="card-shine pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-white/25 opacity-0 group-hover:opacity-100" />
          <Link href={`/products/${product.slug}`} prefetch={false} className="absolute inset-0 block">
            {product.imageUrl ? (
              <>
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  quality={70}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className={`object-cover object-[center_12%] transition duration-500 ease-out ${
                    canHoverSwap ? "group-hover:opacity-0" : "group-hover:scale-[1.04]"
                  }`}
                />
                {hoverReady && canHoverSwap ? (
                  <Image
                    src={hoverSrc!}
                    alt=""
                    fill
                    quality={70}
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover object-[center_12%] opacity-0 transition duration-400 group-hover:opacity-100"
                  />
                ) : null}
              </>
            ) : (
              <div className="h-full w-full bg-line" />
            )}
          </Link>

          {product.discountPercent > 0 && (
            <span className="absolute left-2 top-2 z-10 bg-danger px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
              −{product.discountPercent}%
            </span>
          )}
          {product.isNew && product.discountPercent <= 0 ? (
            <span className="absolute left-2 top-2 z-10 bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink">
              New
            </span>
          ) : null}

          <div className="absolute bottom-2 left-2 right-2 z-10 flex translate-y-2 gap-1 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="flex flex-1 items-center justify-center gap-1 bg-white/95 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ink"
            >
              <Eye className="h-3 w-3" /> Quick shop
            </button>
            {onWishlist ? (
              <button
                type="button"
                onClick={onWishlist}
                className="flex h-10 w-10 items-center justify-center bg-white/95 text-ink"
                aria-label="Wishlist"
              >
                <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-ink" : ""}`} />
              </button>
            ) : null}
          </div>
        </div>

        <Link href={`/products/${product.slug}`} prefetch={false} className={`mt-3 block ${dense ? "space-y-0.5" : "space-y-1"}`}>
          {product.brand?.name ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{product.brand.name}</p>
          ) : null}
          <h3 className="line-clamp-2 text-[12px] font-normal leading-snug text-ink md:text-[13px]">{product.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-[12px] tabular-nums ${product.discountPercent > 0 ? "text-danger" : "text-ink"}`}>
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price ? (
              <span className="text-[11px] text-muted line-through tabular-nums">{formatINR(product.mrp)}</span>
            ) : null}
          </div>
        </Link>
      </article>

      {quickOpen ? <QuickViewModal open={quickOpen} onClose={() => setQuickOpen(false)} productSlug={product.slug} /> : null}
    </>
  );
}

export function ProductGrid({ products, dense }: { products: ProductCardType[]; dense?: boolean }) {
  if (!products.length) return <p className="py-16 text-center text-sm text-muted">No products found.</p>;
  return (
    <div
      className={
        dense
          ? "grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-4 md:gap-x-3 md:gap-y-12 xl:grid-cols-4"
          : "grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 md:gap-y-12 xl:grid-cols-4"
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} dense={dense} />
      ))}
    </div>
  );
}
