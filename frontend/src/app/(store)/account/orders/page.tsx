"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import { PageState, Spinner } from "@/components/ui/state";
import { expectedDeliveryWindow, friendlyOrderStatus, trackingHeadline } from "@/lib/orders";
import { asAmount, type CustomerOrder } from "@/lib/orderTypes";

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => api<CustomerOrder[]>("/orders") });
  if (isLoading) return <Spinner />;
  const orders = data?.data ?? [];
  if (!orders.length)
    return (
      <PageState title="No orders yet">
        <Link href="/products" className="text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
          Start an edit
        </Link>
      </PageState>
    );

  return (
    <div className="text-ink">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Atelier</p>
      <h1 className="mt-2 font-display text-4xl font-medium italic md:text-5xl">Orders</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">Every dispatch from the house — packing, shipping, and delivery — lives here.</p>

      <div className="mt-8 space-y-4">
        {orders.map((o) => {
          const headline = trackingHeadline(o.status);
          const cover = o.items?.[0]?.imageUrl;
          const cancelled = o.status === "CANCELLED";
          return (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="group grid gap-4 rounded-[1.8rem] border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand md:grid-cols-[88px_1fr_auto] md:p-5"
            >
              <div className="relative hidden h-28 w-[72px] overflow-hidden bg-surface-muted md:block">
                {cover ? <Image src={cover} alt="" fill sizes="72px" className="object-cover object-top" /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{o.orderNumber}</p>
                <p className="mt-1 font-display text-2xl font-medium italic leading-tight">{headline.title}</p>
                <p className="mt-1 text-sm text-muted">{headline.subtitle}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                  Placed {formatDate(o.createdAt)}
                  {!cancelled ? ` · Arrives ${expectedDeliveryWindow(o.createdAt)}` : ""}
                </p>
              </div>
              <div className="flex items-end justify-between gap-4 md:flex-col md:items-end md:justify-between">
                <span
                  className={`inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    cancelled ? "bg-danger/10 text-danger" : "bg-brand-soft text-brand-text"
                  }`}
                >
                  {friendlyOrderStatus(o.status)}
                </span>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{formatMoney(asAmount(o.total))}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted group-hover:text-ink">
                    View details <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
