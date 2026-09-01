"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&h=1200&q=80",
    alt: "Dresses",
  },
  {
    src: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1800&h=1200&q=80",
    alt: "Tops",
  },
  {
    src: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1800&h=1200&q=80",
    alt: "Bottoms",
  },
  {
    src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&h=1200&q=80",
    alt: "Ethnic wear",
  },
  {
    src: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1800&h=1200&q=80",
    alt: "Outerwear",
  },
];

const INTERVAL_MS = 4000;

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn(
              "object-cover object-[center_top] transition-opacity duration-1000 ease-out",
              active ? "opacity-100" : "opacity-0",
              active && !reduceMotion && (i % 2 === 0 ? "animate-hero-kenburns-a" : "animate-hero-kenburns-b"),
            )}
          />
        );
      })}
      <div className="absolute inset-0" style={{ background: "var(--hero-veil)" }} />

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === index ? "w-8 bg-brand" : "w-2 bg-white/55 hover:bg-white",
            )}
          />
        ))}
      </div>
    </div>
  );
}
