"use client";

import { motion } from "framer-motion";
import { easeOut } from "@/lib/motion";

const SPARKS = [
  { x: -72, y: -48, delay: 0.35, size: 5 },
  { x: 78, y: -36, delay: 0.48, size: 4 },
  { x: -88, y: 18, delay: 0.55, size: 3 },
  { x: 92, y: 28, delay: 0.42, size: 6 },
  { x: -28, y: -78, delay: 0.62, size: 3 },
  { x: 24, y: 86, delay: 0.5, size: 4 },
  { x: 56, y: -70, delay: 0.7, size: 3 },
  { x: -54, y: 72, delay: 0.58, size: 5 },
];

export function OrderPlacedCeremony({ compact = false }: { compact?: boolean }) {
  const box = compact ? "h-24 w-24" : "h-32 w-32 md:h-36 md:w-36";
  const ring = compact ? "h-36 w-36" : "h-48 w-48 md:h-56 md:w-56";

  return (
    <div className={`relative flex items-center justify-center ${compact ? "h-40 w-40" : "h-56 w-56 md:h-64 md:w-64"}`}>
      <motion.span
        className={`absolute rounded-full border border-[#c4a056]/55 ${ring}`}
        initial={{ scale: 0.55, opacity: 0.7 }}
        animate={{ scale: 1.28, opacity: 0 }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className={`absolute rounded-full border border-white/25 ${ring}`}
        initial={{ scale: 0.55, opacity: 0.5 }}
        animate={{ scale: 1.42, opacity: 0 }}
        transition={{ duration: 2.1, delay: 0.55, repeat: Infinity, ease: "easeOut" }}
      />

      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rotate-45 bg-[#c4a056]"
          style={{ width: s.size, height: s.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
          transition={{ duration: 1.1, delay: s.delay, ease: easeOut }}
        />
      ))}

      <motion.div
        className={`relative z-10 flex ${box} items-center justify-center rounded-full bg-[#c4a056] text-[#1c1915] shadow-[0_24px_70px_-18px_rgba(196,160,86,0.85)]`}
        initial={{ scale: 0.35, rotate: -16, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.12 }}
      >
        <svg viewBox="0 0 56 56" className={compact ? "h-10 w-10" : "h-14 w-14"} fill="none" aria-hidden>
          <motion.circle
            cx="28"
            cy="28"
            r="24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.35"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.28, ease: easeOut }}
          />
          <motion.path
            d="M16 29.2 24.2 37 40 19"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="square"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, delay: 0.55, ease: easeOut }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
