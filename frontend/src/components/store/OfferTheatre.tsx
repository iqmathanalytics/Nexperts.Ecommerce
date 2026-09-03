"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DEFAULT_EDITORIAL, mergeEditorial, type OfferItem, type StorefrontEditorial } from "@/lib/editorial";
import { easeOut } from "@/lib/motion";
import { useEligibleOffers } from "@/hooks/useEligibleOffers";

export const OFFERS: OfferItem[] = DEFAULT_EDITORIAL.offers;
const ROTATE_MS = 4200;

export function OfferTheatre() {
  const editorialQuery = useQuery({
    queryKey: ["editorial"],
    queryFn: () => api<StorefrontEditorial>("/editorial"),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
  const list = mergeEditorial(editorialQuery.data?.data).offers;
  const raw = list.length ? list : OFFERS;
  const offers = useEligibleOffers(raw);
  const [index, setIndex] = useState(0);
  const offer = offers.length ? offers[index % offers.length]! : null;

  useEffect(() => {
    setIndex(0);
  }, [offers.length]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || offers.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % offers.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [offers.length]);

  if (!offer) return null;

  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <div className="offer-shimmer pointer-events-none absolute inset-0 opacity-40" />
      <Link
        href={offer.href}
        className="relative mx-auto flex h-10 max-w-[1400px] items-center justify-center px-4 transition-opacity duration-200 hover:opacity-90 md:h-11"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={offer.code}
            className="flex flex-wrap items-center justify-center gap-x-3 text-[10px] font-semibold uppercase leading-none tracking-[0.2em]"
            initial={{ y: 18, opacity: 0, filter: "blur(6px)", scale: 0.98 }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ y: -14, opacity: 0, filter: "blur(4px)", scale: 1.01 }}
            transition={{ duration: 0.48, ease: easeOut }}
          >
            <motion.span
              className="text-accent"
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              {offer.kicker}
            </motion.span>
            <span className="hidden sm:inline">{offer.text}</span>
            <motion.span
              className="rounded-sm border border-white/25 px-2 py-0.5 tracking-[0.18em]"
              whileHover={{ borderColor: "rgba(255,255,255,0.55)" }}
            >
              {offer.code}
            </motion.span>
          </motion.span>
        </AnimatePresence>
      </Link>
      {offers.length > 1 ? (
        <motion.div
          key={offer.code}
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent/90"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
        />
      ) : null}
    </div>
  );
}
