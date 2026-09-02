"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_NAME } from "@/lib/utils";

const LETTERS = SITE_NAME.toUpperCase().split("");
const HOLD_MS = 800;
const REDUCED_HOLD_MS = 320;
const INTRO_KEY = "nx-intro-v4";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function OpeningScreen() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Prefetch hubs only on home so Mixkit preload hints never leak onto auth pages.
    if (pathname !== "/") return;
    router.prefetch("/women");
    router.prefetch("/men");
  }, [router, pathname]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(INTRO_KEY) === "1") return;
    } catch {
      /* private mode */
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setVisible(true);
    let cancelled = false;

    void wait(reduce ? REDUCED_HOLD_MS : HOLD_MS).then(() => {
      if (cancelled) return;
      setVisible(false);
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#1e3d32] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-6%" }}
          transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.5em] text-white">Nexperts</p>
          <div className="relative mt-6 flex overflow-hidden">
            {LETTERS.map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                className="font-display text-5xl font-medium italic tracking-[0.08em] md:text-8xl"
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.05 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="relative mt-8 h-px bg-[#c4a056]"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
