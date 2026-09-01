"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");
  const id = params.get("id");
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center text-ink">
      <h1 className="text-3xl font-semibold text-ink">Order placed</h1>
      <p className="mt-3 text-muted">Your order {order} is confirmed. You can track it from your account.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href={id ? `/account/orders/${id}` : "/account/orders"} className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-ink hover:bg-brand-deep">
          View order
        </Link>
        <Link href="/products" className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-background">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
