"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const SHOW_AFTER_MS = 450;
const HIDE_AFTER_MS = 120;

/** Branded spinner for page / section waits. */
export function PageLoader({
  label = "Loading",
  className,
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-ink",
        compact ? "py-16" : "min-h-[50svh] py-24",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-[var(--btn-fill-border)] opacity-40" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--btn-fill-text)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">{label}</p>
    </div>
  );
}

/**
 * Top progress + delayed overlay.
 * Shows only when navigation / data work lasts longer than SHOW_AFTER_MS.
 */
export function GlobalLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [routePending, setRoutePending] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetching = useIsFetching({
    predicate: (query) =>
      // Skip quiet background refetches that already have data
      query.state.fetchStatus === "fetching" && query.state.data === undefined,
  });
  // Mutations stay on the button (`pending`) — don't flash a global chip on every click.
  const busy = routePending || fetching > 0;

  useEffect(() => {
    setRoutePending(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        setRoutePending(true);
      } catch {
        /* ignore bad href */
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;

    if (busy) {
      showTimer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    } else {
      hideTimer = window.setTimeout(() => setVisible(false), HIDE_AFTER_MS);
    }

    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [busy]);

  // Safety: never leave the bar stuck if a navigation aborts
  useEffect(() => {
    if (!routePending) return;
    const failSafe = window.setTimeout(() => setRoutePending(false), 12_000);
    return () => window.clearTimeout(failSafe);
  }, [routePending]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[130] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="relative h-[3px] w-full overflow-hidden bg-transparent">
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,var(--accent),var(--brand),var(--accent),transparent)]",
            visible && "animate-[loading-slide_1.05s_ease-in-out_infinite]",
          )}
        />
      </div>
      {visible && fetching > 0 && !routePending ? (
        <div className="pointer-events-none absolute left-1/2 top-[calc(var(--store-chrome)+1.25rem)] -translate-x-1/2 md:top-24">
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 shadow-[0_12px_30px_-18px_rgba(28,25,21,0.55)] backdrop-blur-sm">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--btn-fill-border)] border-t-[var(--btn-fill-text)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Loading</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
