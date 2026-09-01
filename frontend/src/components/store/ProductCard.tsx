import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch
      className="group block overflow-hidden rounded-xl border border-line/80 bg-surface transition duration-300 hover:border-ink/25 hover:shadow-[0_12px_40px_rgba(15,20,25,0.06)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0eee9]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover object-[center_top] transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-line" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        {product.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-sm bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink shadow-sm backdrop-blur-sm">
            {product.discountPercent}% off
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 rounded-sm bg-ink/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="space-y-2 p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
          {product.brand?.name ?? "Nexperts"}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug tracking-tight text-ink md:text-[0.95rem]">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold tracking-tight text-ink">{formatINR(product.price)}</span>
          {product.mrp > product.price ? (
            <span className="text-xs text-muted line-through">{formatINR(product.mrp)}</span>
          ) : null}
        </div>
        <p className={`text-[11px] font-medium ${product.inStock ? "text-muted" : "text-red-600"}`}>
          {product.inStock ? "Ready to ship" : "Currently unavailable"}
          {product.reviewCount > 0 ? ` · ${product.rating.toFixed(1)} ★` : ""}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (!products.length) return <p className="py-12 text-center text-muted">No products found.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
