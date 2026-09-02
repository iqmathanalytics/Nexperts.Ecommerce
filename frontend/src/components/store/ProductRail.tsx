"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import type { ProductCard as ProductCardType } from "@/lib/types";

export function ProductRail({ products }: { products: ProductCardType[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    scroller.current?.scrollBy({ left: dir * Math.min(window.innerWidth * 0.7, 640), behavior: "smooth" });
  }

  if (!products.length) return null;

  return (
    <div className="relative" style={{ perspective: 1400 }}>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden items-center gap-2 pr-2 md:flex">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/90 backdrop-blur hover:border-ink"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/90 backdrop-blur hover:border-ink"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-6 pt-2 scrollbar-none md:gap-4"
      >
        {products.map((p, i) => (
          <div
            key={p.id}
            className="w-[52vw] shrink-0 snap-start sm:w-[34vw] md:w-[24vw] xl:w-[20vw]"
            style={{ transform: `translateY(${i % 2 === 0 ? 0 : 28}px) rotateY(${i % 2 === 0 ? -4 : 4}deg)` }}
          >
            <ProductCard product={p} dense index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
