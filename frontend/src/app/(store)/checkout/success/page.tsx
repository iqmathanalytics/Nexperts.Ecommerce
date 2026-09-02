"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Package, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatMoney, SITE_NAME } from "@/lib/utils";
import { expectedDeliveryWindow, paymentLabel } from "@/lib/orders";
import { asAmount, formatAddress, type CustomerOrder } from "@/lib/orderTypes";
import { OrderPlacedCeremony } from "@/components/store/OrderPlacedCeremony";
import { easeOut } from "@/lib/motion";

function SuccessInner() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const id = params.get("id");
  const orderQuery = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<CustomerOrder>(`/orders/${id}`),
    enabled: Boolean(id),
  });
  const order = orderQuery.data?.data;
  const pay = order?.payments?.[0];
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "60123456789";

  return (
    <div className="bg-background text-ink">
      <section className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden bg-[#1e3d32] px-6 py-24 text-center text-white">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full border border-[#c4a056]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(196,160,86,0.22),transparent_55%)]" />

        <OrderPlacedCeremony />

        <motion.p
          className="relative mt-8 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#c4a056]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.55, ease: easeOut }}
        >
          House confirmation
        </motion.p>
        <motion.h1
          className="relative mt-4 max-w-xl font-display text-5xl font-medium italic leading-[0.92] text-white md:text-7xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.7, ease: easeOut }}
        >
          It’s yours.
        </motion.h1>
        <motion.p
          className="relative mt-5 max-w-md text-sm leading-relaxed text-white/85 md:text-base"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.55, ease: easeOut }}
        >
          {SITE_NAME} has sealed your order. A note is on its way, and the atelier is preparing your pieces.
        </motion.p>
        {orderNumber ? (
          <motion.p
            className="relative mt-8 border border-white/20 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.5, ease: easeOut }}
          >
            {orderNumber}
          </motion.p>
        ) : null}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Package, k: "Confirmed", v: "Held at the house until packed" },
            {
              icon: Truck,
              k: "Arrives",
              v: order ? expectedDeliveryWindow(order.createdAt) : "2–4 business days",
            },
            { icon: MapPin, k: "Payment", v: paymentLabel(pay?.method) },
          ].map((card, i) => (
            <motion.div
              key={card.k}
              className="rounded-[1.6rem] border border-line bg-surface p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: easeOut }}
            >
              <card.icon className="h-4 w-4 text-[#1e3d32]" />
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4f4a42]">{card.k}</p>
              <p className="mt-2 font-display text-2xl font-medium italic leading-tight text-[#1c1915]">{card.v}</p>
            </motion.div>
          ))}
        </div>

        {order ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[2rem] border border-line bg-surface">
              <div className="border-b border-line px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Pieces in this order</p>
                <p className="mt-1 font-display text-2xl font-medium italic">
                  {order.items.length} {order.items.length === 1 ? "silhouette" : "silhouettes"}
                </p>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4 border-b border-line px-6 py-5 last:border-b-0">
                    <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-surface-muted">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover object-top" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{item.productName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                        {item.variantName ?? item.sku} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm tabular-nums">{formatMoney(asAmount(item.unitPrice) * item.quantity)}</p>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-line px-6 py-5 text-sm">
                <p className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatMoney(asAmount(order.subtotal))}</span>
                </p>
                {asAmount(order.discount) > 0 ? (
                  <p className="flex justify-between text-muted">
                    <span>House offer{order.couponCode ? ` · ${order.couponCode}` : ""}</span>
                    <span>−{formatMoney(asAmount(order.discount))}</span>
                  </p>
                ) : null}
                <p className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span>{asAmount(order.shipping) === 0 ? "Complimentary" : formatMoney(asAmount(order.shipping))}</span>
                </p>
                <p className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(asAmount(order.total))}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-line bg-surface p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Deliver to</p>
                <p className="mt-3 font-display text-2xl font-medium italic">{order.shippingAddress?.fullName}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{formatAddress(order.shippingAddress)}</p>
                {order.shippingAddress?.phone ? (
                  <p className="mt-2 text-sm text-muted">{order.shippingAddress.phone}</p>
                ) : null}
                {order.createdAt ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">Placed {formatDate(order.createdAt)}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="btn-store inline-flex h-12 items-center justify-center gap-2 bg-[#1c1915] px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2a2620]"
                >
                  Track this order <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/products"
                  className="btn-store inline-flex h-12 items-center justify-center border border-line bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1c1915]"
                >
                  Continue the edit
                </Link>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  WhatsApp the house
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href={id ? `/account/orders/${id}` : "/account/orders"}
              className="btn-store inline-flex h-12 items-center justify-center gap-2 bg-[#1c1915] px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#2a2620]"
            >
              View order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/products"
              className="btn-store inline-flex h-12 items-center justify-center border border-line bg-white px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1c1915]"
            >
              Continue shopping
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70svh] items-center justify-center bg-[#1e3d32]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-hidden />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
