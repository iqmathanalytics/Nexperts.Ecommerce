"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ReviewForm, type ReviewEligible } from "@/components/store/ReviewForm";
import { Toast } from "@/components/ui/state";
import { useState } from "react";
import Link from "next/link";

type Review = { id: number; title: string; rating: number; comment: string; status: string; productName: string; productSlug: string };

export default function ReviewsPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const reviews = useQuery({ queryKey: ["my-reviews"], queryFn: () => api<Review[]>("/reviews") });
  const eligible = useQuery({ queryKey: ["review-eligible"], queryFn: () => api<ReviewEligible[]>("/reviews/eligible") });

  return (
    <div className="text-ink">
      <h1 className="text-3xl font-semibold text-ink">Reviews</h1>
      <p className="mt-2 text-sm text-muted">Review products from your orders. Verified reviews are accepted and published straight away.</p>
      {msg && (
        <div className="mt-3">
          <Toast message={msg} />
        </div>
      )}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-ink">Write a review</h2>
        <ReviewForm
          eligible={eligible.data?.data ?? []}
          onSuccess={setMsg}
          onError={setMsg}
        />
      </div>
      {(eligible.data?.data ?? []).length > 0 && (
        <div className="mt-6 rounded-xl border border-line bg-background p-4">
          <p className="text-sm font-medium">Ready to review</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {eligible.data!.data.map((e) => (
              <li key={`${e.orderId}-${e.productId}`}>
                {e.productName} · {e.orderNumber}
                {e.productSlug ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link href={`/products/${e.productSlug}`} className="text-ink font-semibold underline-offset-2 hover:underline">
                      View product
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-8">
        <h2 className="mb-3 font-semibold text-ink">Your reviews</h2>
        <div className="space-y-3">
          {(reviews.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">No reviews submitted yet.</p>
          ) : (
            reviews.data!.data.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-white p-4">
                <p className="font-medium text-ink">
                  {r.productName} · {r.rating}/5 · {r.status === "APPROVED" ? "Accepted" : r.status === "PENDING" ? "Pending" : r.status === "REJECTED" ? "Rejected" : r.status}
                </p>
                <p className="text-sm text-ink">{r.title}</p>
                <p className="text-sm text-muted">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
