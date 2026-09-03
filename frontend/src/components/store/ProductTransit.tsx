"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { easeOut } from "@/lib/motion";

/** Short curtain after sync router.push from the click handler. */
const REVEAL_MS = 70;

export function ProductTransit() {
  const { productTransit, clearProductTransit } = useStoreUi();
  const path = usePathname();
  const [phase, setPhase] = useState<"cover" | "reveal">("cover");

  useEffect(() => {
    if (!productTransit) return;
    setPhase("cover");
    const failsafe = window.setTimeout(() => clearProductTransit(), 500);
    return () => window.clearTimeout(failsafe);
  }, [productTransit, clearProductTransit]);

  useEffect(() => {
    if (!productTransit) return;
    const dest = productTransit.href.split("?")[0] ?? productTransit.href;
    if (path !== dest) return;
    setPhase("reveal");
    const done = window.setTimeout(() => clearProductTransit(), REVEAL_MS);
    return () => window.clearTimeout(done);
  }, [path, productTransit, clearProductTransit]);

  return (
    <AnimatePresence>
      {productTransit ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[140] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-brand"
            initial={{ x: "-100%" }}
            animate={{ x: phase === "reveal" ? "-100%" : "0%" }}
            transition={{ duration: 0.1, ease: easeOut }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-brand-deep"
            initial={{ x: "100%" }}
            animate={{ x: phase === "reveal" ? "100%" : "0%" }}
            transition={{ duration: 0.1, ease: easeOut }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-white">
            <p className="nexperts-mark text-[10px] text-white/60">Nexperts</p>
            <p className="mt-2 max-w-sm text-center font-display text-2xl font-semibold leading-tight md:text-3xl">
              {productTransit.name}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
