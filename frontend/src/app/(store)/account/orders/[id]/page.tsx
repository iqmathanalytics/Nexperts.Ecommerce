"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/utils";
import { PageState, Spinner, Toast } from "@/components/ui/state";
import { ReviewForm, type ReviewEligible } from "@/components/store/ReviewForm";
import { OrderTracking } from "@/components/store/OrderTracking";
import { canCancelOrder, friendlyOrderStatus } from "@/lib/orders";
import { useState } from "react";

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  createdAt: string;
  items: Array<{ id: number; productId: number; productName: string; quantity: number; unitPrice: string; sku: string }>;
  history: Array<{ id: number; toStatus: string; createdAt: string; note: string | null }>;
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<Order>(`/orders/${id}`),
    refetchInterval: 30_000,
  });
  const eligible = useQuery({
    queryKey: ["review-eligible"],
    queryFn: () => api<ReviewEligible[]>("/reviews/eligible"),
    enabled: data?.data?.status === "DELIVERED",
  });
  const orderEligible = (eligible.data?.data ?? []).filter((e) => e.orderId === Number(id));
  const cancel = useMutation({
    mutationFn: () => api(`/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Changed mind" }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      setMsg("Order cancelled");
    },
    onError: (e: Error) => setMsg(e.message),
  });
  if (isLoading) return <Spinner />;
  if (isError || !data) return <PageState title="Order not found" />;
  const o = data.data;
  const canCancel = canCancelOrder(o.status);

  return (
    <div className="text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Order details</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{o.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted">
            Placed {formatDate(o.createdAt)} · Payment {o.paymentStatus} · {friendlyOrderStatus(o.status)}
          </p>
        </div>
        {canCancel ? (
          <Button variant="danger" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
            {cancel.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        ) : null}
      </div>

      {msg ? (
        <div className="mt-3">
          <Toast message={msg} />
        </div>
      ) : null}

      <div className="mt-6">
        <OrderTracking status={o.status} createdAt={o.createdAt} history={o.history ?? []} />
      </div>

      <div className="mt-6 space-y-2 rounded-xl border border-line bg-white p-4">
        <p className="text-sm font-semibold text-ink">Items in this order</p>
        {o.items.map((i) => {
          const canReview = orderEligible.some((e) => e.productId === i.productId);
          return (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink">
              <span>
                {i.productName} × {i.quantity} ({i.sku})
              </span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatINR(Number(i.unitPrice) * i.quantity)}</span>
                {canReview ? <span className="text-xs font-semibold text-ink">Review available</span> : null}
              </div>
            </div>
          );
        })}
        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <p className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatINR(Number(o.subtotal))}</span>
          </p>
          <p className="flex justify-between text-muted">
            <span>Discount</span>
            <span>-{formatINR(Number(o.discount))}</span>
          </p>
          <p className="flex justify-between text-muted">
            <span>Tax</span>
            <span>{formatINR(Number(o.tax))}</span>
          </p>
          <p className="flex justify-between text-muted">
            <span>Shipping</span>
            <span>{formatINR(Number(o.shipping))}</span>
          </p>
          <p className="flex justify-between font-semibold text-ink">
            <span>Total</span>
            <span>{formatINR(Number(o.total))}</span>
          </p>
        </div>
      </div>

      {o.status === "DELIVERED" && orderEligible.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-3 font-medium">Review your purchase</h2>
          <ReviewForm eligible={orderEligible} onSuccess={setMsg} onError={setMsg} />
        </div>
      ) : null}
    </div>
  );
}
