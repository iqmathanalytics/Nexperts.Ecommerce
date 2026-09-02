"use client";

import { Check, Package, PackageCheck, PackageOpen, Truck, XCircle } from "lucide-react";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import {
  TRACKING_STEPS,
  friendlyHistoryLabel,
  milestoneReachedAt,
  trackingHeadline,
  trackingStepIndex,
} from "@/lib/orders";

type HistoryEntry = {
  id: number;
  toStatus: string;
  createdAt: string;
  note: string | null;
};

const STEP_ICONS = [Package, PackageOpen, PackageCheck, Truck, Check] as const;

export function OrderTracking({
  status,
  createdAt,
  history,
}: {
  status: string;
  createdAt: string;
  history: HistoryEntry[];
}) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-[1.8rem] border border-danger/20 bg-surface p-5 md:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
            <XCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-medium italic text-ink">Order cancelled</p>
            <p className="mt-1 text-sm text-muted">This order was cancelled and will not be shipped.</p>
          </div>
        </div>
        {history.length > 0 ? <TrackingTimeline history={history} /> : null}
      </div>
    );
  }

  const current = trackingStepIndex(status);
  const headline = trackingHeadline(status);
  const dates = milestoneReachedAt(history, createdAt);
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="rounded-[1.8rem] border border-line bg-surface p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Package tracking</p>
          <h2 className="mt-2 font-display text-3xl font-medium italic tracking-tight text-ink">{headline.title}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{headline.subtitle}</p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-ink">
          {TRACKING_STEPS[current]?.label ?? "Ordered"}
        </span>
      </div>

      {/* Amazon-style horizontal tracker */}
      <ol className="mt-8 hidden md:grid md:grid-cols-5 md:gap-0">
        {TRACKING_STEPS.map((step, i) => {
          const Icon = STEP_ICONS[i]!;
          const done = i < current;
          const active = i === current;
          const upcoming = i > current;
          const date = dates[step.id];
          return (
            <li key={step.id} className="relative flex flex-col items-center text-center">
              {i < TRACKING_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 h-1 rounded-full",
                    i < current ? "bg-ink" : "bg-line",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition",
                  done && "border-ink bg-ink text-white",
                  active && "border-ink bg-brand text-ink shadow-sm",
                  upcoming && "border-line bg-background text-muted",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" />}
              </span>
              <p
                className={cn(
                  "mt-3 text-sm font-semibold",
                  done || active ? "text-ink" : "text-muted",
                )}
              >
                {step.label}
              </p>
              <p className="mt-1 max-w-[11rem] text-xs leading-relaxed text-muted">{step.description}</p>
              {date && (done || active) ? (
                <p className="mt-2 text-xs font-medium text-ink">{formatDate(date)}</p>
              ) : (
                <p className="mt-2 text-xs text-muted">{upcoming ? "Pending" : ""}</p>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile vertical steps */}
      <ol className="mt-6 space-y-0 md:hidden">
        {TRACKING_STEPS.map((step, i) => {
          const Icon = STEP_ICONS[i]!;
          const done = i < current;
          const active = i === current;
          const upcoming = i > current;
          const date = dates[step.id];
          return (
            <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
              {i < TRACKING_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "absolute bottom-0 left-[0.95rem] top-10 w-0.5",
                    i < current ? "bg-ink" : "bg-line",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  done && "border-ink bg-ink text-white",
                  active && "border-ink bg-brand text-ink",
                  upcoming && "border-line bg-background text-muted",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn("text-sm font-semibold", done || active ? "text-ink" : "text-muted")}>
                  {step.label}
                  {date && (done || active) ? (
                    <span className="ml-2 text-xs font-medium text-muted">{formatDate(date)}</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <TrackingTimeline history={sortedHistory} />
    </div>
  );
}

function TrackingTimeline({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mt-8 border-t border-line pt-6">
      <p className="text-sm font-semibold text-ink">Tracking activity</p>
      <p className="mt-1 text-xs text-muted">Updates appear here when our team moves your order forward.</p>
      <ol className="relative mt-4 space-y-0">
        {sorted.map((entry, index) => (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < sorted.length - 1 ? (
              <span className="absolute bottom-0 left-[0.4rem] top-3 w-px bg-line" aria-hidden />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full",
                index === 0 ? "bg-ink" : "bg-line",
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{friendlyHistoryLabel(entry.toStatus)}</p>
              <p className="mt-0.5 text-xs text-muted">{formatDateTime(entry.createdAt)}</p>
              {entry.note ? <p className="mt-1 text-xs text-muted">{entry.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
