"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { easeOut } from "@/lib/motion";

const REVEAL_MS = 180;

export function ProductTransit() {
  const { productTransit, clearProductTransit } = useStoreUi();
  const router = useRouter();
  const path = usePathname();
  const [phase, setPhase] = useState<"cover" | "reveal">("cover");

  useEffect(() => {
    if (!productTransit) return;
    setPhase("cover");
    router.push(productTransit.href);
    const failsafe = window.setTimeout(() => clearProductTransit(), 900);
    return () => window.clearTimeout(failsafe);
  }, [productTransit, router, clearProductTransit]);

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
          transition={{ duration: 0.15 }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-brand"
            initial={{ x: "-100%" }}
            animate={{ x: phase === "reveal" ? "-100%" : "0%" }}
            transition={{ duration: 0.22, ease: easeOut }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-brand-deep"
            initial={{ x: "100%" }}
            animate={{ x: phase === "reveal" ? "100%" : "0%" }}
            transition={{ duration: 0.22, ease: easeOut }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-white">
            <p className="nexperts-mark text-[10px] text-white/60">Nexperts</p>
            <p className="mt-2 max-w-sm text-center font-display text-3xl font-semibold leading-tight">
              {productTransit.name}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
