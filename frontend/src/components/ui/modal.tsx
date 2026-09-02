"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { drawer, fade, modal } from "@/lib/motion";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[min(96rem,96vw)]",
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            {...fade}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-md border border-line bg-surface shadow-2xl sm:rounded-sm",
              widths[size],
              className,
            )}
            {...modal}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              {title ? <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2> : <span />}
              <button type="button" onClick={onClose} className="rounded-sm p-2 text-muted transition hover:bg-surface-muted hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "right" | "left";
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const fromLeft = side === "left";

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]">
          <motion.button type="button" aria-label="Close drawer" className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" {...fade} onClick={onClose} />
          <motion.aside
            className={cn(
              "absolute top-0 flex h-full w-full max-w-md flex-col border-line bg-surface shadow-2xl",
              fromLeft ? "left-0 border-r" : "right-0 border-l",
              className,
            )}
            initial={{ x: fromLeft ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: fromLeft ? "-100%" : "100%" }}
            transition={drawer.transition}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              {title ? <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2> : <span />}
              <button type="button" onClick={onClose} className="rounded-sm p-2 text-muted transition hover:bg-surface-muted hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
