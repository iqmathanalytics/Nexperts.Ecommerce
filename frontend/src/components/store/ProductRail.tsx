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
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden items-center gap-2 pr-2 md:flex">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-line bg-white/90 backdrop-blur hover:border-ink"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-line bg-white/90 backdrop-blur hover:border-ink"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-none md:gap-4"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[46vw] shrink-0 snap-start sm:w-[32vw] md:w-[22vw] xl:w-[18vw]">
            <ProductCard product={p} dense />
          </div>
        ))}
      </div>
    </div>
  );
}
