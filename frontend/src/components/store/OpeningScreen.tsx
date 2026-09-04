"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_NAME } from "@/lib/utils";
import {
  clearIntroPending,
  introAlreadySeen,
  markIntroSeen as persistIntroSeen,
  prefersReducedMotion,
  splashTotalMs,
  SPLASH_EXIT_MS,
  SPLASH_FAILSAFE_MS,
  wait,
} from "@/lib/splash";

const LETTERS = SITE_NAME.toUpperCase().split("");

function shouldShowIntro(pathname: string) {
  return pathname === "/" && !introAlreadySeen();
}

export function OpeningScreen() {
  const router = useRouter();
  const pathname = usePathname();
  // Always false on SSR + first paint — early CSS cover prevents flash; avoids hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    router.prefetch("/women");
    router.prefetch("/men");
    router.prefetch("/products");
    router.prefetch("/sale");
  }, [router, pathname]);

  useEffect(() => {
    if (!mounted) return;

    if (!shouldShowIntro(pathname)) {
      setVisible(false);
      clearIntroPending();
      return;
    }

    setVisible(true);
    document.documentElement.classList.add("nx-intro-pending");

    let cancelled = false;
    const total = splashTotalMs();

    void wait(total).then(() => {
      if (cancelled) return;
      // Unlock scroll immediately — do not wait for Motion exitComplete.
      clearIntroPending();
      persistIntroSeen();
      setVisible(false);
    });

    // Hard failsafe if timers / Motion misbehave.
    const failsafe = window.setTimeout(() => {
      if (cancelled) return;
      clearIntroPending();
      persistIntroSeen();
      setVisible(false);
    }, Math.max(total + 500, SPLASH_FAILSAFE_MS));

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      clearIntroPending();
    };
  }, [pathname, mounted]);

  if (!mounted) return null;

  return (
    <AnimatePresence onExitComplete={clearIntroPending}>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#1e3d32] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SPLASH_EXIT_MS, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="relative flex overflow-hidden">
            {LETTERS.map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                className="font-display text-5xl font-medium italic tracking-[0.08em] md:text-8xl"
                initial={reduced ? false : { y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.55, delay: 0.12 + i * 0.06, ease: [0.22, 1, 0.36, 1] }
                }
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="relative mt-8 h-px bg-[#c4a056]"
            initial={reduced ? false : { width: 0 }}
            animate={{ width: 160 }}
            transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.p
            className="relative mt-6 max-w-xs px-6 text-center text-[11px] font-medium uppercase tracking-[0.32em] text-white/75 md:max-w-md md:text-xs"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.55, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            Cut for the tropics. Worn worldwide.
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
