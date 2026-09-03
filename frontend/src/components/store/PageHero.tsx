"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { toHeroBanner } from "@/lib/imageLoader";
import { PageBackCorner } from "@/components/store/BackButton";

export function PageHero({
  image,
  kicker,
  title,
  subtitle,
  children,
  focal = "center",
  backHref = "/",
  showBack = true,
}: {
  image?: string | null;
  kicker: string;
  title: string;
  subtitle?: string | null;
  children?: ReactNode;
  /** Where the subject sits in the frame for object-position. */
  focal?: "center" | "top" | "upper";
  backHref?: string;
  showBack?: boolean;
}) {
  const src = image ? toHeroBanner(image) : null;
  const position = focal === "top" ? "center top" : focal === "upper" ? "center 30%" : "center center";

  return (
    <section className="category-hero relative isolate overflow-hidden bg-brand text-white">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          priority
          quality={60}
          sizes="100vw"
          className="category-hero-media"
          style={{ objectPosition: position }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--hero-veil)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15" />
      {showBack ? <PageBackCorner fallback={backHref} tone="light" /> : null}
      <div className="relative z-10 mx-auto flex h-full min-h-[inherit] w-full max-w-7xl flex-col justify-end px-4 pb-10 pt-[calc(var(--store-chrome)+2rem)] md:px-6 md:pb-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75">{kicker}</p>
        <h1 className="mt-3 max-w-[16ch] text-balance font-display text-4xl font-semibold tracking-tight md:text-6xl lg:text-[4.25rem]">
          {title}
        </h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-white/85 md:text-[15px]">{subtitle}</p> : null}
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </section>
  );
}
