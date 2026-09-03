"use client";

import { Banknote, CreditCard, Package, RotateCcw, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import type { StoreCommerce } from "@/lib/productFetch";

export type { StoreCommerce };

export const FALLBACK_COMMERCE: StoreCommerce = {
  currency: "MYR",
  payments: [
    {
      id: "COD",
      available: true,
      label: "Cash on delivery",
      note: "Pay in cash when your order arrives. Available on every order.",
    },
    {
      id: "ONLINE",
      available: true,
      label: "Pay online",
      note: "Cards, UPI, and netbanking at checkout when the gateway is enabled.",
    },
  ],
  shipping: {
    eta: "2–5 business days",
    dispatch: "24–48 hours",
    freeOver: 999,
    flat: 49,
    note: "Tracked dispatch worldwide. Remote areas may take a little longer.",
  },
  returns: { days: 7, note: "Unused items with tags attached. Start a return from your order page." },
  packaging: "Premium packaging on every order.",
};

export function useStoreCommerce(enabled = true) {
  return useQuery({
    queryKey: ["commerce"],
    queryFn: () => api<StoreCommerce>("/commerce"),
    staleTime: 10 * 60_000,
    enabled,
    select: (res) => res.data,
  });
}

const SPEC_SKIP = new Set(["Styling", "Model"]);

export function ProductCommerceDetails({
  compact,
  description,
  specifications,
  shippingInfo,
  returnInfo,
  sku,
  commerce: commerceProp,
}: {
  compact?: boolean;
  description?: string | null;
  specifications?: Record<string, string> | null;
  shippingInfo?: string | null;
  returnInfo?: string | null;
  sku?: string | null;
  commerce?: StoreCommerce;
}) {
  const commerceQuery = useStoreCommerce(!commerceProp);
  const commerce = commerceProp ?? commerceQuery.data ?? FALLBACK_COMMERCE;
  const specs = Object.entries(specifications ?? {}).filter(([k]) => !SPEC_SKIP.has(k));
  const styling = specifications?.Styling;
  const model = specifications?.Model;
  const PaymentIcon = { COD: Banknote, ONLINE: CreditCard };

  return (
    <div className={compact ? "mt-6 space-y-5" : "mt-10 space-y-6"}>
      {description ? (
        <p className={`leading-7 text-muted ${compact ? "text-sm" : "text-sm"}`}>{description}</p>
      ) : null}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">How you can pay</p>
        <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
          {commerce.payments.map((method) => {
            const Icon = PaymentIcon[method.id];
            return (
              <div key={method.id} className="border border-line bg-surface px-3 py-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-brand" />
                  {method.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                      method.available ? "bg-brand-soft text-brand-text" : "bg-surface-muted text-muted"
                    }`}
                  >
                    {method.available ? "Available" : "At checkout"}
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-5 text-muted">{method.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      <ul className={`grid gap-3 text-xs text-muted ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <li className="flex gap-2.5">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>
            Dispatch in {commerce.shipping.dispatch}. Arrives in {commerce.shipping.eta}. Free over {formatMoney(commerce.shipping.freeOver)}.
          </span>
        </li>
        <li className="flex gap-2.5">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>{commerce.returns.days}-day returns. {commerce.returns.note}</span>
        </li>
        <li className="flex gap-2.5">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>{commerce.packaging} {commerce.shipping.note}</span>
        </li>
        <li className="flex gap-2.5">
          <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>Order type: cash on delivery or pay online — you choose at checkout.</span>
        </li>
      </ul>

      <div className="divide-y divide-line border-y border-line">
        {specs.length || sku ? (
          <details className="group" open={!compact}>
            <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Product details
            </summary>
            <dl className="space-y-2 pb-5 text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6">
                  <dt className="text-muted">{k}</dt>
                  <dd className="max-w-[62%] text-right">{v}</dd>
                </div>
              ))}
              {sku ? (
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">SKU</dt>
                  <dd className="max-w-[62%] text-right">{sku}</dd>
                </div>
              ) : null}
            </dl>
          </details>
        ) : null}
        {styling ? (
          <details>
            <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
              How to wear
            </summary>
            <p className="pb-5 text-sm leading-7 text-muted">{styling}</p>
          </details>
        ) : null}
        {model ? (
          <details>
            <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
              Fit & model
            </summary>
            <p className="pb-5 text-sm leading-7 text-muted">{model}. Use the size guide for body measurements.</p>
          </details>
        ) : null}
        <details>
          <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Shipping & service
          </summary>
          <p className="pb-5 text-sm leading-7 text-muted">
            {shippingInfo ?? `Ships within ${commerce.shipping.dispatch}. ${commerce.shipping.note} Complimentary shipping over ${formatMoney(commerce.shipping.freeOver)}.`}
          </p>
        </details>
        <details>
          <summary className="cursor-pointer list-none py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Returns
          </summary>
          <p className="pb-5 text-sm leading-7 text-muted">
            {returnInfo ?? `${commerce.returns.days}-day returns. ${commerce.returns.note}`}
          </p>
        </details>
      </div>
    </div>
  );
}
