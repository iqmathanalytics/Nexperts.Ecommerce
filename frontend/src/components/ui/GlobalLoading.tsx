"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/** Show the top bar immediately — delayed bars feel like the click did nothing. */
const SHOW_AFTER_MS = 0;
const HIDE_AFTER_MS = 80;

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

function isInternalNavAnchor(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Instant top progress on in-app navigation.
 * Uses pointerdown so feedback starts before click handlers / preventDefault.
 * Client-only after mount to avoid SSR/client class mismatches.
 */
export function GlobalLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [routePending, setRoutePending] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetching = useIsFetching({
    predicate: (query) => query.state.fetchStatus === "fetching" && query.state.data === undefined,
  });
  const busy = routePending || fetching > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setRoutePending(false);
    document.documentElement.classList.remove("nx-route-pending");
    document.querySelectorAll("[data-nav-pending='true']").forEach((el) => {
      el.removeAttribute("data-nav-pending");
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!mounted) return;
    const arm = (event: Event) => {
      if (!(event instanceof PointerEvent) && !(event instanceof MouseEvent)) return;
      if ("button" in event && event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (anchor instanceof HTMLAnchorElement && isInternalNavAnchor(anchor)) {
        anchor.setAttribute("data-nav-pending", "true");
        document.documentElement.classList.add("nx-route-pending");
        setRoutePending(true);
        return;
      }
      const button = target?.closest("button[data-nav], a[data-nav]");
      if (button instanceof HTMLElement) {
        button.setAttribute("data-nav-pending", "true");
        document.documentElement.classList.add("nx-route-pending");
        setRoutePending(true);
      }
    };
    document.addEventListener("pointerdown", arm, true);
    document.addEventListener("click", arm, true);
    return () => {
      document.removeEventListener("pointerdown", arm, true);
      document.removeEventListener("click", arm, true);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
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
  }, [busy, mounted]);

  useEffect(() => {
    if (!mounted || !routePending) return;
    const failSafe = window.setTimeout(() => {
      setRoutePending(false);
      document.documentElement.classList.remove("nx-route-pending");
    }, 8_000);
    return () => window.clearTimeout(failSafe);
  }, [routePending, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[130] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="relative h-[2px] w-full overflow-hidden bg-transparent">
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,var(--accent),var(--brand),var(--accent),transparent)]",
            visible && "animate-[loading-slide_0.85s_ease-in-out_infinite]",
          )}
        />
      </div>
    </div>
  );
}
