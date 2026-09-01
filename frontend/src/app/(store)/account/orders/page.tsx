"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/input";
import { PageState, Spinner } from "@/components/ui/state";
import { friendlyOrderStatus, trackingHeadline } from "@/lib/orders";

type Order = { id: number; orderNumber: string; status: string; paymentStatus: string; total: string; createdAt: string };

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => api<Order[]>("/orders") });
  if (isLoading) return <Spinner />;
  const orders = data?.data ?? [];
  if (!orders.length) return <PageState title="No orders yet" />;
  return (
    <div className="text-ink">
      <h1 className="text-3xl font-semibold text-ink">Orders</h1>
      <p className="mt-1 text-sm text-muted">Track packing and shipping updates from your order details.</p>
      <div className="mt-4 space-y-3">
        {orders.map((o) => {
          const headline = trackingHeadline(o.status);
          return (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="block rounded-xl border border-line bg-white p-4 transition hover:border-ink"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{o.orderNumber}</p>
                  <p className="mt-1 text-sm text-muted">Placed {formatDate(o.createdAt)}</p>
                  <p className="mt-2 text-sm font-medium text-ink">{headline.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{headline.subtitle}</p>
                </div>
                <div className="text-right">
                  <Badge>{friendlyOrderStatus(o.status)}</Badge>
                  <p className="mt-2 text-sm font-semibold text-ink">{formatINR(Number(o.total))}</p>
                  <p className="mt-1 text-xs font-semibold text-ink underline-offset-2">Track package</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
