"use client";

import { useState } from "react";
import { FitFeedbackChip, StarRating } from "@/components/ui/state";

export function ReviewCarousel({
  reviews,
}: {
  reviews: Array<{
    id: number;
    rating: number;
    title: string;
    comment: string;
    firstName: string;
    fitFeedback?: string | null;
  }>;
}) {
  const [idx, setIdx] = useState(0);
  if (!reviews.length) return null;
  const pageSize = 3;
  const pages = Math.ceil(reviews.length / pageSize);
  const slice = reviews.slice(idx * pageSize, idx * pageSize + pageSize);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {slice.map((r) => (
          <blockquote key={r.id} className="border border-line bg-background p-6">
            <StarRating value={r.rating} />
            <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink">{r.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{r.comment}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">{r.firstName}</p>
              {r.fitFeedback ? <FitFeedbackChip fit={r.fitFeedback} /> : null}
            </div>
          </blockquote>
        ))}
      </div>
      {pages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Reviews page ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 w-8 transition ${i === idx ? "bg-ink" : "bg-line"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
