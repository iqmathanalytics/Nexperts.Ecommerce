"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HERO_SLIDES } from "@/lib/editorial";

const INTERVAL_MS = 5200;

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
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const next = (index + 1) % HERO_SLIDES.length;

  return (
    <div className="absolute inset-0">
      {HERO_SLIDES.map((slide, i) => {
        if (i !== index && i !== next) return null;
        const active = i === index;
        return (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            quality={60}
            sizes="100vw"
            className={cn(
              "object-cover object-[center_18%] transition-opacity duration-700 ease-out",
              active ? "opacity-100" : "opacity-0",
              active && !reduceMotion && (i % 2 === 0 ? "animate-hero-kenburns-a" : "animate-hero-kenburns-b"),
            )}
          />
        );
      })}
      <div className="absolute inset-0" style={{ background: "var(--hero-veil)" }} />

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.caption}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === index ? "w-10 bg-white" : "w-2 bg-white/45 hover:bg-white",
            )}
          />
        ))}
      </div>
    </div>
  );
}
