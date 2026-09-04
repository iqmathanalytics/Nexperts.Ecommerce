"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DEFAULT_EDITORIAL, mergeEditorial, type OfferItem, type StorefrontEditorial } from "@/lib/editorial";
import { easeOut, offerItem, offerModal, offerStagger } from "@/lib/motion";
import { useEligibleOffers } from "@/hooks/useEligibleOffers";
import { useIntroReady } from "@/hooks/useIntroReady";
import { offerKindLabel } from "@/lib/offers";

const SEEN_PREFIX = "nx-offer-side-v3:";
const SKIP_PREFIXES = ["/checkout", "/login", "/register", "/forgot-password", "/admin"];
/** Delay before the first side offer appears. */
const SHOW_DELAY_MS = 2200;
/** Combo / side offers stay visible this long, then auto-advance or close. */
const OFFER_DURATION_MS = 10_000;
/** Brief beat between offers when auto-advancing. */
const SWITCH_GAP_MS = 400;

function seenKey(code: string) {
  return `${SEEN_PREFIX}${code.trim().toUpperCase()}`;
}

function dismissed(code: string) {
  try {
    return localStorage.getItem(seenKey(code)) === "1";
  } catch {
    return false;
  }
}

function remember(code: string) {
  try {
    localStorage.setItem(seenKey(code), "1");
  } catch {
    /* ignore */
  }
}

export function OfferPopups() {
  const path = usePathname();
  const introReady = useIntroReady(400);
  const editorialQuery = useQuery({
    queryKey: ["editorial"],
    queryFn: () => api<StorefrontEditorial>("/editorial"),
    staleTime: 5 * 60_000,
    enabled: introReady,
  });
  const offers = mergeEditorial(editorialQuery.data?.data).offers;
  const rawList = offers.length ? offers : DEFAULT_EDITORIAL.offers;
  const list = useEligibleOffers(rawList);

  const quiet = useMemo(() => SKIP_PREFIXES.some((p) => path.startsWith(p)), [path]);
  const [seenTick, setSeenTick] = useState(0);
  const queue = useMemo(
    () => list.filter((o) => o.code && !dismissed(o.code)),
    [list, seenTick],
  );
  const queueKey = useMemo(() => queue.map((o) => o.code).join("|"), [queue]);

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasShownRef = useRef(false);
  const timers = useRef<{ show: number; advance: number }>({ show: 0, advance: 0 });

  const active = open ? (queue[0] ?? null) : null;

  function clearTimers() {
    window.clearTimeout(timers.current.show);
    window.clearTimeout(timers.current.advance);
  }

  function finishCurrent() {
    const current = queue[0];
    if (current) remember(current.code);
    setOpen(false);
    setCopied(false);
    setSeenTick((n) => n + 1);
  }

  useEffect(() => {
    window.clearTimeout(timers.current.show);
    if (quiet) {
      window.clearTimeout(timers.current.advance);
      setOpen(false);
      return;
    }
    if (open || !queue.length) {
      if (!queue.length) setOpen(false);
      return;
    }

    if (!introReady) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = hasShownRef.current ? SWITCH_GAP_MS : reduce ? 500 : SHOW_DELAY_MS;
    timers.current.show = window.setTimeout(() => {
      hasShownRef.current = true;
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timers.current.show);
  }, [quiet, open, queueKey, queue.length, introReady]);

  useEffect(() => {
    if (!open || !queue[0]) return;
    window.clearTimeout(timers.current.advance);
    timers.current.advance = window.setTimeout(finishCurrent, OFFER_DURATION_MS);
    return () => window.clearTimeout(timers.current.advance);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hold only while this unseen offer is showing
  }, [open, queueKey]);

  useEffect(() => clearTimers, []);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {active ? (
        <SideOffer
          key={active.code}
          offer={active}
          kind={offerKindLabel(active)}
          copied={copied}
          durationMs={OFFER_DURATION_MS}
          onCopy={() => copyCode(active.code)}
          onClose={finishCurrent}
        />
      ) : null}
    </AnimatePresence>
  );
}

function SideOffer({
  offer,
  kind,
  copied,
  durationMs,
  onCopy,
  onClose,
}: {
  offer: OfferItem;
  kind: string;
  copied: boolean;
  durationMs: number;
  onCopy: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const showCode = offer.code.trim().toUpperCase() !== "FREE";

  return (
    <motion.aside
      className="pointer-events-none fixed bottom-0 right-0 z-[95] flex items-end justify-end p-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:p-4 md:pb-4"
      role="dialog"
      aria-modal="false"
      aria-labelledby="offer-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.22 } }}
    >
      <motion.div
        className="pointer-events-auto relative w-[min(17rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-[0_20px_48px_-20px_rgba(20,40,32,0.4)]"
        {...offerModal}
      >
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-120%", skewX: -16 }}
            animate={{ x: "320%" }}
            transition={{ duration: 1.15, delay: 0.2, ease: easeOut }}
          />
        </div>

        <div className="relative overflow-hidden bg-brand px-3.5 pb-3 pt-3.5 pr-10">
          <div className="orb orb-a opacity-60" />
          <div className="orb orb-b opacity-40" />
          <motion.div variants={offerStagger} initial="initial" animate="animate" className="relative">
            <motion.p variants={offerItem} className="text-[9px] font-semibold uppercase tracking-[0.24em] text-accent">
              {kind}
            </motion.p>
            <motion.p
              id="offer-title"
              variants={offerItem}
              className="pt-1 font-display text-xl font-semibold leading-tight text-white"
            >
              {offer.kicker}
            </motion.p>
          </motion.div>
        </div>

        <motion.div className="relative px-3.5 py-3" variants={offerStagger} initial="initial" animate="animate">
          <motion.p variants={offerItem} className="text-xs leading-relaxed text-muted">
            {offer.text}
          </motion.p>

          {showCode ? (
            <motion.button
              type="button"
              variants={offerItem}
              onClick={onCopy}
              whileTap={{ scale: 0.97 }}
              className="mt-3 flex w-full items-center justify-between rounded-full border border-line bg-background px-3 py-2 text-left transition-colors duration-200"
            >
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">Use code</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? "ok" : offer.code}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="font-display text-base font-semibold tracking-[0.1em]"
                >
                  {copied ? "Copied" : offer.code}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ) : null}

          <motion.div variants={offerItem}>
            <Link
              href={offer.href}
              onClick={onClose}
              className="btn-store btn-fill mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            >
              <motion.span
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3 w-3 text-accent" />
              </motion.span>
              Claim offer
            </Link>
          </motion.div>
          <motion.button
            type="button"
            variants={offerItem}
            onClick={onClose}
            className="mt-1.5 w-full py-1 text-[9px] uppercase tracking-[0.16em] text-muted transition-colors duration-200 hover:text-ink"
          >
            Continue shopping
          </motion.button>
        </motion.div>

        <motion.button
          type="button"
          aria-label="Close"
          onClick={onClose}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-200 hover:bg-white/25"
        >
          <X className="h-3 w-3" />
        </motion.button>

        <motion.div
          key={`timer-${offer.code}`}
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: durationMs / 1000, ease: "linear" }}
          aria-hidden
        />
      </motion.div>
    </motion.aside>
  );
}
