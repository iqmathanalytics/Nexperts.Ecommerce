"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { api } from "@/lib/api";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { QuickViewModal } from "@/components/store/QuickViewModal";
import { TiltStage } from "@/components/store/TiltStage";
import { easeOut } from "@/lib/motion";

export function ProductCard({
  product,
  secondaryImageUrl,
  onWishlist,
  wishlisted,
  dense,
  offset,
  index = 0,
}: {
  product: ProductCardType;
  secondaryImageUrl?: string | null;
  onWishlist?: () => void;
  wishlisted?: boolean;
  dense?: boolean;
  offset?: boolean;
  index?: number;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [hoverReady, setHoverReady] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();
  const href = `/products/${product.slug}`;
  const hoverSrc = secondaryImageUrl || product.hoverImageUrl || null;
  const canHoverSwap = Boolean(hoverSrc && hoverSrc !== product.imageUrl);

  function prefetchQuickView() {
    router.prefetch(href);
    void qc.prefetchQuery({
      queryKey: ["product", product.slug, "lite"],
      queryFn: () => api(`/products/${product.slug}?lite=1`),
      staleTime: 60_000,
    });
  }

  return (
    <>
      <motion.article
        className={cn("group relative", offset && "md:mt-14")}
        onMouseEnter={() => {
          if (canHoverSwap) setHoverReady(true);
          prefetchQuickView();
        }}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.18, delay: Math.min(index, 4) * 0.015, ease: easeOut }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
      >
        <TiltStage className="relative">
          <div className="relative isolate px-2 pt-2">
            <div className="product-podium" />
            <div className="product-arch relative aspect-[3/4] overflow-hidden bg-surface-muted/70 shadow-[0_28px_60px_-28px_rgba(28,25,21,0.45)] ring-1 ring-white/40 transition duration-500 group-hover:shadow-[0_36px_70px_-24px_rgba(28,25,21,0.5)]">
              <span className="card-shine pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-white/20 opacity-0 group-hover:opacity-100" />
              <Link href={href} prefetch className="absolute inset-0 block">
                {product.imageUrl ? (
                  <>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      quality={65}
                      priority={index < 4}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                      className={cn(
                        "object-cover object-top transition duration-500 ease-out",
                        // Touch devices keep :hover stuck after tap — never hide the primary
                        // image unless a real hover pointer is available and the swap is ready.
                        canHoverSwap
                          ? "max-md:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-0"
                          : "[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.02]",
                      )}
                    />
                    {hoverReady && canHoverSwap ? (
                      <Image
                        src={hoverSrc!}
                        alt=""
                        fill
                        quality={60}
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="pointer-events-none object-cover object-top opacity-0 transition duration-400 max-md:hidden [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="h-full w-full bg-line" />
                )}
              </Link>

              {product.discountPercent > 0 && (
                <motion.span
                  className="absolute left-4 top-5 z-10 rounded-full bg-danger/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white"
                  initial={{ scale: 0.7, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 16 }}
                >
                  −{product.discountPercent}%
                </motion.span>
              )}
              {product.isNew && product.discountPercent <= 0 ? (
                <span className="absolute left-4 top-5 z-10 rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1c1915]">
                  New
                </span>
              ) : null}

              <div className="absolute bottom-4 left-1/2 z-10 flex w-[78%] -translate-x-1/2 translate-y-2 justify-center gap-1 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
                <button
                  type="button"
                  onMouseEnter={prefetchQuickView}
                  onFocus={prefetchQuickView}
                  onClick={() => setQuickOpen(true)}
                  className="btn-store flex flex-1 items-center justify-center gap-1 rounded-full bg-white py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1c1915] shadow-lg"
                >
                  <Eye className="h-3 w-3" /> Quick shop
                </button>
                {onWishlist ? (
                  <button
                    type="button"
                    onClick={onWishlist}
                    className="btn-store flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1c1915] shadow-lg"
                    aria-label="Wishlist"
                  >
                    <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-[#1c1915]" : ""}`} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </TiltStage>

        <Link href={href} prefetch className={`mt-5 block text-center ${dense ? "space-y-0.5" : "space-y-1"}`}>
          {product.brand?.name ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{product.brand.name}</p>
          ) : null}
          <h3 className="mx-auto line-clamp-2 max-w-[16rem] font-display text-[1.05rem] font-semibold leading-snug text-ink md:text-lg">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-[12px] tabular-nums ${product.discountPercent > 0 ? "text-danger" : "text-ink"}`}>
              {formatMoney(product.price)}
            </span>
            {product.mrp > product.price ? (
              <span className="text-[11px] text-muted line-through tabular-nums">{formatMoney(product.mrp)}</span>
            ) : null}
          </div>
        </Link>
      </motion.article>

      {quickOpen ? (
        <QuickViewModal
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          productSlug={product.slug}
          preview={{
            name: product.name,
            brandName: product.brand?.name,
            imageUrl: product.imageUrl,
            price: product.price,
            mrp: product.mrp,
          }}
        />
      ) : null}
    </>
  );
}

export function ProductGrid({ products, dense }: { products: ProductCardType[]; dense?: boolean }) {
  if (!products.length) return <p className="py-16 text-center text-sm text-muted">No products found.</p>;
  return (
    <div
      className={
        dense
          ? "grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-4 md:gap-x-6 md:gap-y-16"
          : "grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-8 md:gap-y-20 xl:grid-cols-4"
      }
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} dense={dense} offset={i % 2 === 1} index={i} />
      ))}
    </div>
  );
}
