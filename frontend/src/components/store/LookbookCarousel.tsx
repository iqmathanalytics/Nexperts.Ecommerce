"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function LookbookCarousel({
  items,
}: {
  items: Array<{
    id: number;
    slug: string;
    title: string;
    coverImageUrl: string | null;
    videoUrl?: string | null;
  }>;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    scroller.current?.scrollBy({ left: dir * Math.min(window.innerWidth * 0.8, 720), behavior: "smooth" });
  }

  if (!items.length) return null;

  return (
    <section className="border-y border-line bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-end justify-between px-4 pt-14 md:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Lookbook</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Shop the story</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scroll(-1)} className="border border-white/30 p-2 hover:bg-white/10" aria-label="Previous">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} className="border border-white/30 p-2 hover:bg-white/10" aria-label="Next">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div ref={scroller} className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-14 scrollbar-none md:px-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/lookbooks/${item.slug}`}
            className="relative h-[28rem] w-[min(85vw,28rem)] shrink-0 snap-center overflow-hidden"
          >
            {item.videoUrl ? (
              <video src={item.videoUrl} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
            ) : item.coverImageUrl ? (
              <Image src={item.coverImageUrl} alt="" fill className="object-cover" sizes="420px" />
            ) : (
              <div className="absolute inset-0 bg-white/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="font-display text-2xl font-semibold">{item.title}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Shop lookbook</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
