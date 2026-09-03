"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_NAME } from "@/lib/utils";
import { introAlreadySeen, markIntroSeen as persistIntroSeen, splashHoldMs, wait } from "@/lib/splash";

const LETTERS = SITE_NAME.toUpperCase().split("");

export function OpeningScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    router.prefetch("/women");
    router.prefetch("/men");
  }, [router, pathname]);

  useEffect(() => {
    if (pathname !== "/" || introAlreadySeen()) return;
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
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#1e3d32] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
                transition={{ duration: 0.4, delay: 0.04 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="relative mt-8 h-px bg-[#c4a056]"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
