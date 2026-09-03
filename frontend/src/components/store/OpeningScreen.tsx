"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_NAME } from "@/lib/utils";
import {
  clearIntroPending,
  introAlreadySeen,
  markIntroSeen as persistIntroSeen,
  splashHoldMs,
  SPLASH_EXIT_MS,
  wait,
} from "@/lib/splash";

const LETTERS = SITE_NAME.toUpperCase().split("");

function shouldShowIntro(pathname: string) {
  return pathname === "/" && !introAlreadySeen();
}

export function OpeningScreen() {
  const router = useRouter();
  const pathname = usePathname();
  // Start covered on home so the site never flashes under the splash.
  const [visible, setVisible] = useState(() => (typeof window !== "undefined" ? shouldShowIntro(pathname) : false));

  useEffect(() => {
    if (pathname !== "/") return;
    router.prefetch("/women");
    router.prefetch("/men");
  }, [router, pathname]);

  useEffect(() => {
    if (!shouldShowIntro(pathname)) {
      setVisible(false);
      clearIntroPending();
      return;
    }

    setVisible(true);

    let cancelled = false;
    void wait(splashHoldMs()).then(() => {
      if (cancelled) return;
      setVisible(false);
      persistIntroSeen();
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        clearIntroPending();
      }}
    >
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#1e3d32] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SPLASH_EXIT_MS, ease: [0.76, 0, 0.24, 1] }}
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
                transition={{ duration: 0.55, delay: 0.12 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="relative mt-8 h-px bg-[#c4a056]"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
