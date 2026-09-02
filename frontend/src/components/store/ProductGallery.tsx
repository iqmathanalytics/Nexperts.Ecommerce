"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

type Img = { id: number; url: string; isPrimary: boolean };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [zoom, setZoom] = useState<Img | null>(null);
  const shots = images.length ? images : [];

  return (
    <>
      <div className="grid gap-2 md:grid-cols-2 md:gap-3">
        {shots.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setZoom(img)}
            className={`group relative overflow-hidden bg-surface-muted ${
              i === 0 && shots.length === 1 ? "md:col-span-2 aspect-[3/4]" : i === 2 ? "md:col-span-2 aspect-[16/10]" : "aspect-[3/4]"
            }`}
          >
            <Image
              src={img.url}
              alt={`${name} ${i + 1}`}
              fill
              priority={i === 0}
              quality={70}
              sizes={i === 2 ? "80vw" : "(max-width:768px) 100vw, 40vw"}
              className="object-cover object-[center_12%] transition duration-700 ease-out group-hover:scale-[1.06]"
            />
            <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-white/90 opacity-0 transition group-hover:opacity-100">
              <ZoomIn className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {zoom ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
          >
            <button type="button" className="absolute right-4 top-4 text-white" aria-label="Close" onClick={() => setZoom(null)}>
              <X className="h-7 w-7" />
            </button>
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative h-[88vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={zoom.url} alt={name} fill className="object-contain" sizes="100vw" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
