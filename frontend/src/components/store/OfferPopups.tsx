"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DEFAULT_EDITORIAL, mergeEditorial, type OfferItem, type StorefrontEditorial } from "@/lib/editorial";
import { easeOut, offerDock, offerModal } from "@/lib/motion";

const WELCOME_KEY = "nx-offer-welcome-v1";
const DOCK_KEY = "nx-offer-dock-v1";
const SKIP_PREFIXES = ["/checkout", "/login", "/register", "/forgot-password", "/admin"];

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
  const list = offers.length ? offers : DEFAULT_EDITORIAL.offers;
  const welcome = list[0] ?? null;
  const followUp = list[1] ?? list[0] ?? null;

  const quiet = useMemo(() => SKIP_PREFIXES.some((p) => path.startsWith(p)), [path]);

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (quiet || !welcome) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (dismissed(WELCOME_KEY)) return;
    const show = window.setTimeout(() => setWelcomeOpen(true), reduce ? 600 : 1600);
    return () => window.clearTimeout(show);
  }, [quiet, welcome]);

  useEffect(() => {
    if (quiet || !followUp || welcomeOpen) return;
    if (dismissed(DOCK_KEY)) return;
    const show = window.setTimeout(() => setDockOpen(true), 16000);
    return () => window.clearTimeout(show);
  }, [quiet, followUp, welcomeOpen]);

  function closeWelcome() {
    setWelcomeOpen(false);
    remember(WELCOME_KEY);
  }

  function closeDock() {
    setDockOpen(false);
    remember(DOCK_KEY);
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
      className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.05 } }}
    >
      <motion.button
        type="button"
        aria-label="Dismiss offer"
        className="absolute inset-0 bg-brand-deep/55 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-surface text-ink shadow-[0_40px_90px_-28px_rgba(20,40,32,0.55)]"
        {...offerModal}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="relative h-36 overflow-hidden bg-brand">
          <div className="orb orb-a opacity-70" />
          <div className="orb orb-b opacity-50" />
          <p className="relative px-7 pt-7 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">House offer</p>
          <p id="offer-title" className="relative px-7 pt-2 font-display text-4xl font-semibold text-white">
            {offer.kicker}
          </p>
        </div>
        <div className="px-7 py-6">
          <p className="text-sm leading-relaxed text-muted">{offer.text}</p>
          <button
            type="button"
            onClick={onCopy}
            className="mt-5 flex w-full items-center justify-between rounded-full border border-line bg-background px-5 py-3 text-left"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Use code</span>
            <span className="font-display text-2xl font-semibold tracking-[0.12em]">{copied ? "Copied" : offer.code}</span>
          </button>
          <Link
            href={offer.href}
            onClick={onClose}
            className="btn-store btn-fill mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Claim offer
          </Link>
          <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-[10px] uppercase tracking-[0.18em] text-muted hover:text-ink">
            Continue shopping
          </button>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function DockOffer({ offer, onClose }: { offer: OfferItem; onClose: () => void }) {
  return (
    <motion.div className="fixed bottom-20 left-4 right-4 z-[80] mx-auto max-w-sm md:bottom-6 md:left-auto md:right-5" {...offerDock}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 pr-12 shadow-[0_22px_60px_rgba(28,25,21,0.18)]">
        <motion.div
          className="absolute inset-x-0 top-0 h-1 bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.45, ease: easeOut }}
          style={{ transformOrigin: "left" }}
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{offer.kicker}</p>
        <p className="mt-1 font-display text-xl font-semibold">{offer.code}</p>
        <p className="mt-1 text-sm text-muted">{offer.text}</p>
        <Link
          href={offer.href}
          onClick={onClose}
          className="mt-3 inline-flex text-[10px] font-semibold uppercase tracking-[0.18em] text-brand underline-offset-4 hover:underline"
        >
          Shop the offer
        </Link>
        <button
          type="button"
          aria-label="Dismiss offer"
          onClick={onClose}
          className="absolute right-2 top-2 p-2 text-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
