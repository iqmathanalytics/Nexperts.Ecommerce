import { cn } from "@/lib/utils";

export function ScarcityBanner({ available, className }: { available: number; className?: string }) {
  if (available <= 0 || available > 5) return null;
  return (
    <div className={cn("border border-brand/40 bg-brand-soft px-3 py-2 text-xs font-semibold tracking-wide text-brand-text", className)}>
      Only {available} left in this size — order soon.
    </div>
  );
}
