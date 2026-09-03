"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DEFAULT_EDITORIAL, mergeEditorial, type OfferItem, type StorefrontEditorial } from "@/lib/editorial";
import { easeOut, offerCorner, offerDock, offerItem, offerModal, offerStagger } from "@/lib/motion";
import { useEligibleOffers } from "@/hooks/useEligibleOffers";

const WELCOME_KEY = "nx-offer-welcome-v1";
const DOCK_KEY = "nx-offer-dock-v1";
const CORNER_KEY = "nx-offer-corner-v1";
const SKIP_PREFIXES = ["/checkout", "/login", "/register", "/forgot-password", "/admin"];

const SPARKS = [
  { top: "18%", left: "12%", delay: 0.05, size: 4 },
  { top: "28%", left: "78%", delay: 0.18, size: 3 },
  { top: "62%", left: "18%", delay: 0.28, size: 5 },
  { top: "72%", left: "70%", delay: 0.12, size: 3 },
  { top: "42%", left: "88%", delay: 0.34, size: 4 },
  { top: "8%", left: "52%", delay: 0.22, size: 3 },
];

function dismissed(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function remember(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function OfferPopups() {
  const path = usePathname();
  const editorialQuery = useQuery({
    queryKey: ["editorial"],
    queryFn: () => api<StorefrontEditorial>("/editorial"),
    staleTime: 5 * 60_000,
  });
  const offers = mergeEditorial(editorialQuery.data?.data).offers;
  const rawList = offers.length ? offers : DEFAULT_EDITORIAL.offers;
  const list = useEligibleOffers(rawList);
  const welcome = list[0] ?? null;
  const followUp = list[1] ?? list[0] ?? null;
  const cornerOffers = list.length > 1 ? list.slice(1) : list;

  const quiet = useMemo(() => SKIP_PREFIXES.some((p) => path.startsWith(p)), [path]);

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [cornerOpen, setCornerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cornerIndex, setCornerIndex] = useState(0);

  useEffect(() => {
    if (quiet || !welcome) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (dismissed(WELCOME_KEY)) return;
    const show = window.setTimeout(() => setWelcomeOpen(true), reduce ? 700 : 2400);
    return () => window.clearTimeout(show);
  }, [quiet, welcome]);

  useEffect(() => {
    if (quiet || !followUp || welcomeOpen) return;
    if (dismissed(DOCK_KEY)) return;
    const show = window.setTimeout(() => setDockOpen(true), 14000);
    return () => window.clearTimeout(show);
  }, [quiet, followUp, welcomeOpen]);

  useEffect(() => {
    if (quiet || welcomeOpen || dockOpen || !cornerOffers.length) return;
    if (dismissed(CORNER_KEY)) return;
    const show = window.setTimeout(() => setCornerOpen(true), welcome ? 9000 : 5000);
    return () => window.clearTimeout(show);
  }, [quiet, welcomeOpen, dockOpen, cornerOffers.length, welcome]);

  useEffect(() => {
    if (!cornerOpen || cornerOffers.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setCornerIndex((i) => (i + 1) % cornerOffers.length), 4200);
    return () => window.clearInterval(id);
  }, [cornerOpen, cornerOffers.length]);

  function closeWelcome() {
    setWelcomeOpen(false);
    remember(WELCOME_KEY);
  }

  function closeDock() {
    setDockOpen(false);
    remember(DOCK_KEY);
  }

  function closeCorner() {
    setCornerOpen(false);
    remember(CORNER_KEY);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const cornerOffer = cornerOffers[cornerIndex % Math.max(cornerOffers.length, 1)];

  return (
    <>
      <AnimatePresence>
        {welcomeOpen && welcome ? (
          <WelcomeOffer
            offer={welcome}
            copied={copied}
            onCopy={() => copyCode(welcome.code)}
            onClose={closeWelcome}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {dockOpen && followUp && !welcomeOpen ? (
          <DockOffer offer={followUp} onClose={closeDock} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cornerOpen && cornerOffer && !welcomeOpen && !dockOpen ? (
          <CornerOffer offer={cornerOffer} offerKey={cornerOffer.code} onClose={closeCorner} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function WelcomeOffer({
  offer,
  copied,
  onCopy,
  onClose,
}: {
  offer: OfferItem;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-end justify-center p-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.06 } }}
    >
      <motion.button
        type="button"
        aria-label="Dismiss offer"
        className="absolute inset-0 bg-brand-deep/55 backdrop-blur-[8px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />

      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute z-[1] rounded-full bg-accent"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.35, 0.9], scale: [0, 1.4, 1, 1.15], y: [0, -10, -4, -16] }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 2.4, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-surface text-ink shadow-[0_40px_90px_-28px_rgba(20,40,32,0.55)]"
        {...offerModal}
        style={{ transformStyle: "preserve-3d", perspective: 900 }}
      >
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: "-120%", skewX: -16 }}
            animate={{ x: "320%" }}
            transition={{ duration: 1.35, delay: 0.35, ease: easeOut }}
          />
        </div>

        <div className="relative h-40 overflow-hidden bg-brand">
          <div className="orb orb-a opacity-70" />
          <div className="orb orb-b opacity-50" />
          <div className="orb orb-c opacity-40" />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(196,160,86,0.35),transparent_55%)]"
            animate={{ opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div variants={offerStagger} initial="initial" animate="animate" className="relative px-7 pt-7">
            <motion.p variants={offerItem} className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">
              House offer
            </motion.p>
            <motion.p
              id="offer-title"
              variants={offerItem}
              className="pt-2 font-display text-4xl font-semibold text-white"
            >
              {offer.kicker}
            </motion.p>
          </motion.div>
        </div>

        <motion.div className="relative px-7 py-6" variants={offerStagger} initial="initial" animate="animate">
          <motion.p variants={offerItem} className="text-sm leading-relaxed text-muted">
            {offer.text}
          </motion.p>
          <motion.button
            type="button"
            variants={offerItem}
            onClick={onCopy}
            whileTap={{ scale: 0.97 }}
            className="mt-5 flex w-full items-center justify-between rounded-full border border-line bg-background px-5 py-3 text-left transition-colors duration-200"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Use code</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? "ok" : offer.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="font-display text-2xl font-semibold tracking-[0.12em]"
              >
                {copied ? "Copied" : offer.code}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <motion.div variants={offerItem}>
            <Link
              href={offer.href}
              onClick={onClose}
              className="btn-store btn-fill mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
            >
              <motion.span
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </motion.span>
              Claim offer
            </Link>
          </motion.div>
          <motion.button
            type="button"
            variants={offerItem}
            onClick={onClose}
            className="mt-3 w-full py-2 text-[10px] uppercase tracking-[0.18em] text-muted transition-colors duration-200 hover:text-ink"
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
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-200 hover:bg-white/25"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function DockOffer({ offer, onClose }: { offer: OfferItem; onClose: () => void }) {
  return (
    <motion.div
      className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-[80] mx-auto max-w-sm md:bottom-6 md:left-auto md:right-5"
      {...offerDock}
    >
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 pr-12 shadow-[0_22px_60px_rgba(28,25,21,0.18)]">
        <motion.div
          className="absolute inset-x-0 top-0 h-1 origin-left bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.55, ease: easeOut }}
        />
        <motion.div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/15"
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.p
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: easeOut }}
        >
          {offer.kicker}
        </motion.p>
        <motion.p
          className="mt-1 font-display text-xl font-semibold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: easeOut }}
        >
          {offer.code}
        </motion.p>
        <motion.p
          className="mt-1 text-sm text-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: easeOut }}
        >
          {offer.text}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>
          <Link
            href={offer.href}
            onClick={onClose}
            className="mt-3 inline-flex text-[10px] font-semibold uppercase tracking-[0.18em] text-brand underline-offset-4 transition-all duration-200 hover:underline"
          >
            Shop the offer
          </Link>
        </motion.div>
        <motion.button
          type="button"
          aria-label="Dismiss offer"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2 top-2 p-2 text-muted transition-colors duration-200 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function CornerOffer({
  offer,
  offerKey,
  onClose,
}: {
  offer: OfferItem;
  offerKey: string;
  onClose: () => void;
}) {
  return (
    <motion.aside
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[75] w-[min(17.5rem,calc(100vw-2rem))] md:bottom-7 md:right-6"
      {...offerCorner}
      layout
    >
      <div className="relative overflow-hidden rounded-[1.35rem] border border-line bg-brand text-white shadow-[0_24px_50px_-22px_rgba(18,40,32,0.55)]">
        <motion.div className="offer-shimmer pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative p-4 pr-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={offerKey}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.38, ease: easeOut }}
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent">{offer.kicker}</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-[0.06em]">{offer.code}</p>
              <p className="mt-1 text-xs leading-snug text-white/75">{offer.text}</p>
            </motion.div>
          </AnimatePresence>
          <Link
            href={offer.href}
            onClick={onClose}
            className="mt-3 inline-flex text-[10px] font-semibold uppercase tracking-[0.18em] text-white underline-offset-4 transition-opacity duration-200 hover:opacity-80 hover:underline"
          >
            View offer
          </Link>
        </div>
        <motion.button
          type="button"
          aria-label="Dismiss offer"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2 top-2 p-2 text-white/70 transition-colors duration-200 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </motion.button>
        <motion.div
          key={`bar-${offerKey}`}
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 4.2, ease: "linear" }}
        />
      </div>
    </motion.aside>
  );
}
