"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_NAME } from "@/lib/utils";

const LETTERS = SITE_NAME.toUpperCase().split("");
/** Hold long enough for letter + gold-line animation to finish. */
const HOLD_MS = 780;
const REDUCED_HOLD_MS = 220;
export const INTRO_KEY = "nx-intro-v4";
export const INTRO_PENDING_CLASS = "nx-intro-pending";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function introAlreadySeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

function clearIntroPending() {
  document.documentElement.classList.remove(INTRO_PENDING_CLASS);
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* private mode */
  }
  clearIntroPending();
}

export function OpeningScreen() {
  const router = useRouter();
  const pathname = usePathname();
  // Client-only (ssr:false): decide immediately so we never mount hidden then reveal late.
  const [visible, setVisible] = useState(() => !introAlreadySeen());

  useEffect(() => {
    if (pathname !== "/") return;
    router.prefetch("/women");
    router.prefetch("/men");
  }, [router, pathname]);

  useEffect(() => {
    if (!visible) {
      clearIntroPending();
      return;
    }

    document.documentElement.classList.add(INTRO_PENDING_CLASS);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    void wait(reduce ? REDUCED_HOLD_MS : HOLD_MS).then(() => {
      if (cancelled) return;
      setVisible(false);
      markIntroSeen();
    });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#1e3d32] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-6%" }}
          transition={{ duration: 0.28, ease: [0.76, 0, 0.24, 1] }}
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
                transition={{ duration: 0.4, delay: 0.02 + i * 0.03, ease: [0.22, 1, 0.36, 1] }}
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
