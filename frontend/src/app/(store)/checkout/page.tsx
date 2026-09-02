"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageState, Spinner, Toast } from "@/components/ui/state";
import { cn, formatMoney } from "@/lib/utils";
import { loginUrl } from "@/lib/auth";
import { paymentLabel } from "@/lib/orders";
import { OrderPlacedCeremony } from "@/components/store/OrderPlacedCeremony";
import { easeOut } from "@/lib/motion";

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default("Malaysia"),
  isDefault: z.boolean().optional(),
});

type Address = z.infer<typeof addressSchema> & { id: number; isDefault?: boolean };

type Quote = {
  cart: {
    items: Array<{ name: string; quantity: number; price: number; imageUrl?: string | null; variantName?: string }>;
    subtotal: number;
  };
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  coupon: { code: string } | null;
};

const STEPS = ["Address", "Shipping", "Offer", "Payment", "Review"] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [error, setError] = useState<string | null>(null);
  const [shippingEta, setShippingEta] = useState<string | null>(null);
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api<Address[]>("/addresses") });
  const quote = useQuery({
    queryKey: ["quote", appliedCoupon],
    queryFn: () => api<Quote>("/checkout/quote", { method: "POST", body: JSON.stringify({ couponCode: appliedCoupon || undefined }) }),
  });
  const addAddress = useMutation({
    mutationFn: (body: z.infer<typeof addressSchema>) =>
      api<Address>("/addresses", { method: "POST", body: JSON.stringify({ ...body, isDefault: true }) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      if (res.data?.id) setAddressId(res.data.id);
      setShowAddForm(false);
      form.reset({ country: "Malaysia", isDefault: true });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });
  const applyCoupon = useMutation({
    mutationFn: (code: string) => api("/coupons/preview", { method: "POST", body: JSON.stringify({ code }) }),
    onSuccess: () => {
      setAppliedCoupon(couponCode.trim());
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });
  const place = useMutation({
    mutationFn: () =>
      api<{ id: number; orderNumber: string }>("/checkout", {
        method: "POST",
        body: JSON.stringify({ addressId, couponCode: appliedCoupon || undefined, paymentMethod }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      router.push(`/checkout/success?order=${res.data.orderNumber}&id=${res.data.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });
  const form = useForm({ resolver: zodResolver(addressSchema), defaultValues: { country: "Malaysia", isDefault: true } });
  const list = addresses.data?.data ?? [];

  useEffect(() => {
    if (!list.length) {
      setShowAddForm(true);
      return;
    }
    setShowAddForm(false);
    const preferred = list.find((a) => a.isDefault) ?? list[0];
    if (preferred && (addressId == null || !list.some((a) => a.id === addressId))) {
      setAddressId(preferred.id);
    }
  }, [list, addressId]);

  if (addresses.isLoading || quote.isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  if (addresses.isError)
    return (
      <PageState title="Please sign in to checkout">
        <a href={loginUrl("/checkout")}>Go to login</a>
      </PageState>
    );
  if (quote.isError) {
    return (
      <PageState title="Your cart cannot be checked out">
        <a href="/cart">Return to cart</a>
      </PageState>
    );
  }
  const q = quote.data?.data;
  const selectedAddress = list.find((a) => a.id === addressId) ?? list.find((a) => a.isDefault) ?? list[0];

  function goNext() {
    if (step === 0 && !addressId) {
      setError("Select or add a delivery address");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="bg-background text-ink">
      <AnimatePresence>
        {place.isPending ? (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#1e3d32] text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <OrderPlacedCeremony compact />
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.36em] text-[#c4a056]">The house</p>
            <p className="mt-3 font-display text-4xl font-medium italic text-white">Sealing your order</p>
            <p className="mt-3 text-sm text-white/75">Please keep this page open for a moment.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="border-b border-[#142820] bg-[#1e3d32] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c4a056]">Private checkout</p>
          <h1 className="mt-3 font-display text-4xl font-medium italic text-white md:text-6xl">Finish the edit</h1>
          <p className="mt-3 max-w-lg text-sm text-white/80">Five quiet steps. Complimentary shipping over RM 999. Cash on delivery is always available.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <ol className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none md:gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex shrink-0 items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold",
                    i < step && "bg-[#1c1915] text-white",
                    i === step && "bg-[#1e3d32] text-white",
                    i > step && "border border-line bg-surface-raised text-muted",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", i === step ? "text-[#1c1915]" : "text-muted")}>
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 ? <span className="mx-1 hidden h-px w-8 bg-line sm:block md:w-12" /> : null}
            </li>
          ))}
        </ol>

        {error ? (
          <div className="mt-6">
            <Toast tone="error" message={error} />
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="rounded-[2rem] border border-line bg-surface p-6 md:p-8 text-[#1c1915]"
          >
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Step 01</p>
                  <h2 className="mt-2 font-display text-3xl font-medium italic">Where should it arrive?</h2>
                </div>

                {list.length > 0 && selectedAddress && !showAddForm ? (
                  <div className="space-y-3">
                    <div className="border border-[#1c1915] bg-[#f3eee6] p-5 text-[#1c1915]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4f4a42]">
                        {selectedAddress.isDefault ? "House default" : "Saved address"}
                      </p>
                      <p className="mt-3 font-display text-2xl font-medium italic text-[#1c1915]">{selectedAddress.fullName}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#4f4a42]">
                        {selectedAddress.line1}
                        {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
                        <br />
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                      </p>
                      <p className="mt-2 text-sm text-[#4f4a42]">{selectedAddress.phone}</p>
                    </div>

                    {list.length > 1 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Other addresses</p>
                        {list
                          .filter((a) => a.id !== selectedAddress.id)
                          .map((a) => (
                            <label key={a.id} className="flex cursor-pointer gap-3 border border-line p-4 transition hover:border-ink">
                              <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                              <span className="text-sm">
                                {a.fullName}
                                {a.isDefault ? " · Default" : ""}, {a.line1}, {a.city} {a.postalCode}
                              </span>
                            </label>
                          ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline"
                      onClick={() => setShowAddForm(true)}
                    >
                      Add another address
                    </button>
                  </div>
                ) : null}

                {(showAddForm || list.length === 0) && (
                  <form className="grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((v) => addAddress.mutate(v))}>
                    <p className="md:col-span-2 text-sm text-muted">
                      {list.length > 0
                        ? "Save a new delivery address. It will be used for this order."
                        : "Add a delivery address to continue. It will be saved for next time."}
                    </p>
                    <div>
                      <Label>Name</Label>
                      <Input {...form.register("fullName")} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input {...form.register("phone")} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input {...form.register("line1")} />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input {...form.register("city")} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input {...form.register("state")} />
                    </div>
                    <div>
                      <Label>Postcode</Label>
                      <Input {...form.register("postalCode")} />
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      <Button type="submit" disabled={addAddress.isPending}>
                        {addAddress.isPending ? "Saving…" : "Save and use address"}
                      </Button>
                      {list.length > 0 ? (
                        <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </form>
                )}

                <Button onClick={goNext} disabled={!addressId} className="h-12 min-w-[12rem] uppercase tracking-[0.18em]">
                  Continue to shipping
                </Button>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Step 02</p>
                <h2 className="mt-2 font-display text-3xl font-medium italic">Standard dispatch</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                  2–4 business days. Complimentary above RM 999. Remote areas may take a day longer.
                </p>
                {q && q.shipping === 0 ? (
                  <p className="mt-4 inline-block border border-[#1e3d32]/25 bg-[#e7efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1e3d32]">
                    Complimentary shipping applied
                  </p>
                ) : null}
                {selectedAddress?.postalCode ? (
                  <button
                    type="button"
                    className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline"
                    onClick={async () => {
                      try {
                        const res = await api<{ warehouses: Array<{ name: string; etaDate: string; businessDays: number }> }>(
                          "/shipping-estimate",
                          { method: "POST", body: JSON.stringify({ pincode: selectedAddress.postalCode }) },
                        );
                        const wh = res.data.warehouses[0];
                        setShippingEta(wh ? `${wh.etaDate} · ${wh.businessDays} business days` : null);
                      } catch {
                        setShippingEta(null);
                      }
                    }}
                  >
                    Estimate for {selectedAddress.postalCode}
                  </button>
                ) : null}
                {shippingEta ? <p className="mt-2 text-sm">{shippingEta}</p> : null}
                <div className="mt-8 flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button onClick={goNext} className="uppercase tracking-[0.16em]">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Step 03</p>
                <h2 className="font-display text-3xl font-medium italic">House offers</h2>
                <p className="text-sm text-muted">Optional. Leave blank if you are not using a code.</p>
                <Label>Coupon code</Label>
                <Input placeholder="WELCOME10" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" type="button" onClick={() => couponCode.trim() && applyCoupon.mutate(couponCode.trim())}>
                    Apply
                  </Button>
                  {appliedCoupon ? (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setAppliedCoupon("");
                        setCouponCode("");
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {q?.coupon ? <Toast message={`Applied ${q.coupon.code}`} /> : null}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" onClick={goNext} className="uppercase tracking-[0.16em]">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Step 04</p>
                <h2 className="font-display text-3xl font-medium italic">How will you pay?</h2>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-4 border p-5 transition",
                    paymentMethod === "COD" ? "border-[#1c1915] bg-[#f3eee6]" : "border-line hover:border-[#1c1915]",
                  )}
                >
                  <input type="radio" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                  <span>
                    <span className="font-display text-xl italic text-[#1c1915]">Cash on delivery</span>
                    <span className="mt-1 block text-sm text-[#4f4a42]">Pay when your order arrives. Always available.</span>
                  </span>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-4 border p-5 transition",
                    paymentMethod === "ONLINE" ? "border-[#1c1915] bg-[#f3eee6]" : "border-line hover:border-[#1c1915]",
                  )}
                >
                  <input type="radio" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} />
                  <span>
                    <span className="font-display text-xl italic text-[#1c1915]">Pay online</span>
                    <span className="mt-1 block text-sm text-[#4f4a42]">Cards and wallets when configured on the server.</span>
                  </span>
                </label>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={goNext} className="uppercase tracking-[0.16em]">
                    Review order
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Step 05</p>
                  <h2 className="mt-2 font-display text-3xl font-medium italic">Confirm and place</h2>
                </div>
                <dl className="grid gap-px bg-line sm:grid-cols-2">
                  {[
                    {
                      k: "Address",
                      v: selectedAddress
                        ? `${selectedAddress.fullName}, ${selectedAddress.line1}, ${selectedAddress.city} ${selectedAddress.postalCode}`
                        : "No address selected",
                    },
                    { k: "Shipping", v: shippingEta ?? "Standard · 2–4 business days" },
                    { k: "Offer", v: q?.coupon?.code ?? "None" },
                    { k: "Payment", v: paymentLabel(paymentMethod) },
                  ].map((row) => (
                    <div key={row.k} className="bg-surface px-0 py-4 sm:px-4">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{row.k}</dt>
                      <dd className="mt-1 text-sm leading-relaxed">{row.v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button disabled={place.isPending || !addressId} onClick={() => place.mutate()} className="h-12 min-w-[14rem] uppercase tracking-[0.2em]">
                    <Lock className="h-3.5 w-3.5" /> Place order · {formatMoney(q?.total ?? 0)}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          <aside className="h-fit rounded-[2rem] border border-line bg-surface p-6 text-[#1c1915] lg:sticky lg:top-28">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4f4a42]">Your edit</p>
            <ul className="mt-4 space-y-4">
              {q?.cart.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug text-[#1c1915]">{i.name}</span>
                    <span className="text-xs text-[#4f4a42]">
                      {i.variantName ? `${i.variantName} · ` : ""}Qty {i.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-[#1c1915]">{formatMoney(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <p className="flex justify-between text-[#4f4a42]">
                <span>Subtotal</span>
                <span>{formatMoney(q?.cart.subtotal ?? 0)}</span>
              </p>
              <p className="flex justify-between text-[#4f4a42]">
                <span>Discount</span>
                <span>−{formatMoney(q?.discount ?? 0)}</span>
              </p>
              <p className="flex justify-between text-[#4f4a42]">
                <span>Shipping</span>
                <span>{(q?.shipping ?? 0) === 0 ? "Complimentary" : formatMoney(q?.shipping ?? 0)}</span>
              </p>
              <p className="flex justify-between pt-2 font-semibold text-[#1c1915]">
                <span>Total</span>
                <span>{formatMoney(q?.total ?? 0)}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
