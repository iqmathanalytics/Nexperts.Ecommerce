"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

function scrollWindowToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Lightweight route fade without framer-motion on the critical path. */
export function PageFade({ children }: { children: ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    scrollWindowToTop();
  }, [path]);

  return (
    <div key={path} className="animate-[rise-in_0.08s_ease-out]">
      {children}
    </div>
  );
}
