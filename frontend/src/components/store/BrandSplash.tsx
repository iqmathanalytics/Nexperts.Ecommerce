"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { SPLASH_EXIT_MS } from "@/lib/splash";
import { SITE_NAME } from "@/lib/utils";

export function BrandSplash({
  open,
  kicker = "Nexperts",
  title,
  subtitle,
  children,
}: {
  open: boolean;
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#1e3d32] px-6 text-center text-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-5%" }}
          transition={{ duration: SPLASH_EXIT_MS, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.5em] text-white">{kicker}</p>
          <p className="mt-6 font-display text-5xl font-medium italic tracking-[0.04em] md:text-7xl">{title}</p>
          {subtitle ? <p className="mt-4 max-w-sm text-sm text-white/75">{subtitle}</p> : null}
          {children}
          <motion.div
            className="mt-8 h-px bg-[#c4a056]"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">{SITE_NAME}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
