"use client";

import { useEligiblePromoTexts } from "@/hooks/useEligibleOffers";

export function PromoMarquee({
  items,
  reverse = false,
  className,
  itemClassName,
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const filtered = useEligiblePromoTexts(items);
  if (!filtered.length) return null;
  const track = [...filtered, ...filtered];

  return (
    <div className={className}>
      <div
        className={`${reverse ? "animate-marquee-reverse gap-10 py-3 text-[11px] tracking-[0.22em]" : "animate-marquee gap-12 py-2.5 text-[10px] tracking-[0.28em]"} flex w-max font-semibold uppercase`}
      >
        {track.map((t, i) => (
          <span key={`${t}-${i}`} className={itemClassName ?? "opacity-85"}>
            {t}
            {!reverse ? <span className="mx-6 text-accent">◆</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
