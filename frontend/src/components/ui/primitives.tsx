import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-sm", className)} {...props} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

export function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />;
}

export function PageState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="font-display text-2xl font-semibold text-ink">{title}</p>
      {children ? <div className="text-sm text-muted">{children}</div> : null}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  const visible = items.filter((i, idx) => !(idx === 0 && i.href === "/" && items.length === 1));
  if (!visible.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
      {visible.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {item.href && i < visible.length - 1 ? (
            <Link href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Swatch({
  color,
  label,
  selected,
  onClick,
  size = "md",
}: {
  color: string;
  label?: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label ?? color}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border transition duration-200",
        size === "sm" ? "h-6 w-6" : "h-8 w-8",
        selected ? "border-ink ring-2 ring-ink/20 ring-offset-2" : "border-line hover:border-ink/50",
      )}
      style={{ backgroundColor: color }}
    />
  );
}

export function QuantitySpinner({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex h-11 items-center overflow-hidden rounded-sm border border-line">
      <button
        type="button"
        className="h-full w-10 text-lg text-muted transition hover:bg-surface-muted hover:text-ink"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        className="h-full w-10 text-lg text-muted transition hover:bg-surface-muted hover:text-ink"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(dim, i < Math.round(value) ? "fill-brand text-brand" : "text-line")}
        />
      ))}
    </div>
  );
}

export function LoyaltyBadge({ points, label = "pts" }: { points: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-brand/40 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      {points.toLocaleString("en-IN")} {label}
    </span>
  );
}

export function FitFeedbackChip({ fit }: { fit: "SMALL" | "TRUE" | "LARGE" | string }) {
  const map: Record<string, string> = {
    SMALL: "Runs small",
    TRUE: "True to size",
    LARGE: "Runs large",
  };
  return (
    <span className="inline-flex rounded-sm border border-line bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
      {map[fit] ?? fit}
    </span>
  );
}
