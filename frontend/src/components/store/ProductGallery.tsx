"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { easeOut } from "@/lib/motion";

type Img = { id: number; url: string; isPrimary: boolean };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const shots = useMemo(() => {
    if (!images.length) return [];
    return [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  }, [images]);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(0);

  const current = shots[Math.min(active, Math.max(shots.length - 1, 0))];

  if (!current) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-surface-muted text-sm text-muted">
        No image available
      </div>
    );
  }

  function go(delta: number) {
    setDir(delta);
    setActive((i) => {
      const next = i + delta;
      if (next < 0) return shots.length - 1;
      if (next >= shots.length) return 0;
      return next;
    });
  }

  function select(index: number) {
    if (index === active) return;
    setDir(index > active ? 1 : -1);
    setActive(index);
  }

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-muted shadow-[0_32px_70px_-32px_rgba(28,25,21,0.45)]">
        <div className="relative aspect-[3/4] w-full">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={current.id}
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d >= 0 ? 36 : -36, scale: 1.02 }),
                center: { opacity: 1, x: 0, scale: 1 },
                exit: (d: number) => ({ opacity: 0, x: d >= 0 ? -28 : 28, scale: 0.985 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: easeOut }}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={`${name} ${active + 1}`}
                fill
                priority={active === 0}
                quality={75}
                sizes="(max-width:1024px) 100vw, 48vw"
                className="object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {shots.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1c1915] shadow"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1c1915] shadow"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {shots.map((img, i) => (
                <span
                  key={img.id}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === active ? "w-5 bg-white" : "w-1.5 bg-white/45"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {shots.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {shots.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => select(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border bg-surface-muted transition duration-200 ${
                i === active ? "border-[#1c1915] opacity-100" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="64px" quality={55} className="object-cover object-top" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
