"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, X } from "lucide-react";

export const OFFERS = [
  { kicker: "First order", code: "WELCOME10", text: "10% off over ₹999", href: "/register" },
  { kicker: "Festive edit", code: "FESTIVE20", text: "20% off celebration wear", href: "/collections/seasonal/festive" },
  { kicker: "Flat deal", code: "FLAT200", text: "₹200 off over ₹1,499", href: "/sale" },
  { kicker: "Shipping", code: "FREE", text: "Free delivery over ₹999", href: "/products" },
];

export function OfferTheatre() {
  const [index, setIndex] = useState(0);
  const [chip, setChip] = useState(false);
  const [chipGone, setChipGone] = useState(false);
  const offer = OFFERS[index]!;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % OFFERS.length), 3800);
    const show = window.setTimeout(() => setChip(true), 3200);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(show);
    };
  }, []);

  return (
    <>
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="offer-shimmer pointer-events-none absolute inset-0 opacity-40" />
        <Link href={offer.href} className="relative mx-auto flex h-10 max-w-[1400px] items-center justify-center px-4 md:h-11">
          <AnimatePresence mode="wait">
            <motion.span
              key={offer.code}
              className="flex flex-wrap items-center justify-center gap-x-3 text-[10px] font-semibold uppercase tracking-[0.22em]"
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

      <AnimatePresence>
        {chip && !chipGone ? (
          <motion.div
            className="fixed bottom-20 right-4 z-[70] md:bottom-6"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <Link
              href="/sale"
              className="group flex items-center gap-3 border border-line bg-white py-3 pl-3 pr-10 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
            >
              <span className="flex h-9 w-9 items-center justify-center bg-ink text-white">
                <Tag className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Live offer</span>
                <span className="mt-0.5 block text-sm font-semibold">{OFFERS[0]!.code} · 10% off</span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Dismiss offer"
              className="absolute right-1.5 top-1.5 p-1 text-muted hover:text-ink"
              onClick={() => setChipGone(true)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
