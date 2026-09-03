"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

function scrollWindowToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Soft route enter — CSS keeps the critical path light. */
export function PageFade({ children }: { children: ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    scrollWindowToTop();
    document.documentElement.classList.remove("nx-route-pending");
  }, [path]);

  return (
    <div key={path} className="page-enter">
      {children}
    </div>
  );
}
