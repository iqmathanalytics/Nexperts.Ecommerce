"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BackButton({
  fallback = "/",
  tone = "light",
  label = "Back",
  className,
}: {
  fallback?: string;
  tone?: "light" | "dark";
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined") {
      const ref = document.referrer;
      if (ref) {
        try {
          if (new URL(ref).origin === window.location.origin) {
            router.back();
            return;
          }
        } catch {
          /* ignore bad referrer */
        }
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      data-nav
      onClick={goBack}
      aria-label={label}
      className={cn(
        "btn-store inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
        tone === "light"
          ? "border border-white/45 bg-black/40 text-white backdrop-blur-sm hover:bg-white hover:text-[#123028]"
          : "btn-fill",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  );
}

/** Absolute left-corner placement for hero / full-bleed dynamic pages. */
export function PageBackCorner({
  fallback = "/",
  tone = "light",
  className,
}: {
  fallback?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute left-4 top-[calc(var(--store-chrome)+0.65rem)] z-20 md:left-6",
        className,
      )}
    >
      <BackButton fallback={fallback} tone={tone} />
    </div>
  );
}
