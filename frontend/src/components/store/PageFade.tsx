"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Lightweight route fade without framer-motion on the critical path. */
export function PageFade({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div key={path} className="animate-[rise-in_0.12s_ease-out]">
      {children}
    </div>
  );
}
