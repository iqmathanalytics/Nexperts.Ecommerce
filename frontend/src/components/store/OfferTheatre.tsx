"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DEFAULT_EDITORIAL, mergeEditorial, type OfferItem, type StorefrontEditorial } from "@/lib/editorial";

export const OFFERS: OfferItem[] = DEFAULT_EDITORIAL.offers;

export function OfferTheatre() {
  const editorialQuery = useQuery({
    queryKey: ["editorial"],
    queryFn: () => api<StorefrontEditorial>("/editorial"),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
  const list = mergeEditorial(editorialQuery.data?.data).offers;
  const offers = list.length ? list : OFFERS;
  const [index, setIndex] = useState(0);
  const offer = offers[index % offers.length]!;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || offers.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % offers.length), 3800);
    return () => window.clearInterval(id);
  }, [offers.length]);

  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <div className="offer-shimmer pointer-events-none absolute inset-0 opacity-40" />
      <Link href={offer.href} className="relative mx-auto flex h-10 max-w-[1400px] items-center justify-center px-4 md:h-11">
        <AnimatePresence mode="wait">
          <motion.span
            key={offer.code}
            className="flex flex-wrap items-center justify-center gap-x-3 text-[10px] font-semibold uppercase leading-none tracking-[0.2em]"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-accent">{offer.kicker}</span>
            <span className="hidden sm:inline">{offer.text}</span>
            <span className="rounded-sm border border-white/25 px-2 py-0.5 tracking-[0.18em]">{offer.code}</span>
          </motion.span>
        </AnimatePresence>
      </Link>
    </div>
  );
}
