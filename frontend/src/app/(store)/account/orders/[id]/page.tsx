"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/utils";
import { PageState, Spinner, Toast } from "@/components/ui/state";
import { ReviewForm, type ReviewEligible } from "@/components/store/ReviewForm";
import { OrderTracking } from "@/components/store/OrderTracking";
import { canCancelOrder, expectedDeliveryWindow, friendlyOrderStatus, paymentLabel } from "@/lib/orders";
import { asAmount, formatAddress, type CustomerOrder } from "@/lib/orderTypes";
import { useState } from "react";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<CustomerOrder>(`/orders/${id}`),
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
  const pay = o.payments?.[0];
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "60123456789";
  const cancelled = o.status === "CANCELLED";

  return (
    <div className="text-ink">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Order {o.orderNumber}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium italic md:text-5xl">{friendlyOrderStatus(o.status)}</h1>
          <p className="mt-2 text-sm text-muted">
            Placed {formatDate(o.createdAt)}
            {!cancelled ? ` · Expected ${expectedDeliveryWindow(o.createdAt)}` : ""}
          </p>
        </div>
        {canCancel ? (
          <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending} className="uppercase tracking-[0.14em]">
            {cancel.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        ) : null}
      </div>

      {msg ? (
        <div className="mt-4">
          <Toast message={msg} />
        </div>
      ) : null}

      <div className="mt-8">
        <OrderTracking status={o.status} createdAt={o.createdAt} history={o.history ?? []} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[1.8rem] border border-line bg-surface">
          <div className="border-b border-line px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Pieces</p>
            <p className="mt-1 font-display text-2xl font-medium italic">
              {o.items.length} {o.items.length === 1 ? "item" : "items"} · {formatMoney(asAmount(o.total))}
            </p>
          </div>
          <ul>
            {o.items.map((i) => {
              const canReview = orderEligible.some((e) => e.productId === i.productId);
              return (
                <li key={i.id} className="flex gap-4 border-b border-line px-6 py-5 last:border-b-0">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-surface-muted">
                    {i.imageUrl ? <Image src={i.imageUrl} alt="" fill sizes="64px" className="object-cover object-top" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{i.productName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                      {i.variantName ?? i.sku} · Qty {i.quantity}
                    </p>
                    {canReview ? (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text">Review available</p>
                    ) : null}
                  </div>
                  <p className="text-sm tabular-nums">{formatMoney(asAmount(i.unitPrice) * i.quantity)}</p>
                </li>
              );
            })}
          </ul>
          <div className="space-y-2 px-6 py-5 text-sm">
            <p className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatMoney(asAmount(o.subtotal))}</span>
            </p>
            <p className="flex justify-between text-muted">
              <span>Discount{o.couponCode ? ` · ${o.couponCode}` : ""}</span>
              <span>−{formatMoney(asAmount(o.discount))}</span>
            </p>
            <p className="flex justify-between text-muted">
              <span>Tax</span>
              <span>{formatMoney(asAmount(o.tax))}</span>
            </p>
            <p className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>{asAmount(o.shipping) === 0 ? "Complimentary" : formatMoney(asAmount(o.shipping))}</span>
            </p>
            <p className="flex justify-between border-t border-line pt-3 font-semibold">
              <span>Total</span>
              <span>{formatMoney(asAmount(o.total))}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.8rem] border border-line bg-surface p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Deliver to</p>
            <p className="mt-3 font-display text-2xl font-medium italic">{o.shippingAddress?.fullName ?? "Saved address"}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{formatAddress(o.shippingAddress) || "Address on file"}</p>
            {o.shippingAddress?.phone ? <p className="mt-2 text-sm text-muted">{o.shippingAddress.phone}</p> : null}
          </div>
          <div className="rounded-[1.8rem] border border-line bg-surface p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Payment</p>
            <p className="mt-3 font-display text-2xl font-medium italic">{paymentLabel(pay?.method)}</p>
            <p className="mt-2 text-sm text-muted">
              {o.paymentStatus === "SUCCESS" ? "Received" : o.paymentStatus === "PENDING" ? "Due on delivery" : o.paymentStatus}
            </p>
          </div>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-[1.8rem] border border-line bg-brand px-6 py-5 text-white transition hover:bg-brand-deep"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Concierge</p>
            <p className="mt-2 font-display text-2xl font-medium italic">Need a hand?</p>
            <p className="mt-1 text-sm text-white/75">WhatsApp the house about this order.</p>
          </a>
          <Link
            href="/products"
            className="inline-flex text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline"
          >
            Continue the edit
          </Link>
        </div>
      </div>

      {o.status === "DELIVERED" && orderEligible.length > 0 ? (
        <div className="mt-8 rounded-[1.8rem] border border-line bg-surface p-6">
          <h2 className="font-display text-2xl font-medium italic">How did it wear?</h2>
          <p className="mt-1 text-sm text-muted">A short note helps the next client choose well.</p>
          <div className="mt-5">
            <ReviewForm eligible={orderEligible} onSuccess={setMsg} onError={setMsg} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
