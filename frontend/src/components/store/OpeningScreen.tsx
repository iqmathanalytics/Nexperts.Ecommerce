"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_NAME } from "@/lib/utils";

const LETTERS = SITE_NAME.toUpperCase().split("");

export function OpeningScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem("nx-intro-v2") === "1") return;
    setVisible(true);
    document.documentElement.style.overflow = "hidden";
    const hide = window.setTimeout(() => {
      sessionStorage.setItem("nx-intro-v2", "1");
      setVisible(false);
      document.documentElement.style.overflow = "";
    }, 2600);
    return () => {
      window.clearTimeout(hide);
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-ink text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-12%" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.5em] text-white/50">Nexperts</p>
          <div className="mt-6 flex overflow-hidden">
            {LETTERS.map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                className="font-display text-5xl font-semibold tracking-[0.18em] md:text-8xl"
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.12 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="mt-8 h-px bg-accent"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.p
            className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.5 }}
          >
            New season · India
          </motion.p>
          <button
            type="button"
            className="absolute bottom-8 text-[10px] uppercase tracking-[0.22em] text-white/45 hover:text-white"
            onClick={() => {
              sessionStorage.setItem("nx-intro-v2", "1");
              setVisible(false);
              document.documentElement.style.overflow = "";
            }}
          >
            Skip
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
