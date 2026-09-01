"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageState, Spinner, Toast } from "@/components/ui/state";
import { formatINR } from "@/lib/utils";
import { loginUrl } from "@/lib/auth";

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default("India"),
  isDefault: z.boolean().optional(),
});

type Address = z.infer<typeof addressSchema> & { id: number; isDefault?: boolean };

type Quote = {
  cart: { items: Array<{ name: string; quantity: number; price: number }>; subtotal: number };
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  coupon: { code: string } | null;
};

const STEPS = ["Address", "Shipping", "Coupon", "Payment", "Review"] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [paymentMethod] = useState<"COD">("COD");
  const [error, setError] = useState<string | null>(null);
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
      form.reset({ country: "India", isDefault: true });
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
  const form = useForm({ resolver: zodResolver(addressSchema), defaultValues: { country: "India", isDefault: true } });
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

  if (addresses.isLoading || quote.isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (addresses.isError) return <PageState title="Please sign in to checkout"><a href={loginUrl("/checkout")}>Go to login</a></PageState>;
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
    <div className="mx-auto max-w-5xl px-4 py-8 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Checkout</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i <= step && setStep(i)}
            className={`rounded-full px-3 py-1 ${i === step ? "bg-ink text-white" : i < step ? "bg-brand-soft text-ink" : "border bg-white text-muted"}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      {error && <div className="mt-4"><Toast tone="error" message={error} /></div>}
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-line bg-white p-5">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Delivery address</p>

              {list.length > 0 && selectedAddress && !showAddForm ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-ink bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {selectedAddress.isDefault ? "Default saved address" : "Saved address"}
                    </p>
                    <p className="mt-2 font-medium text-ink">{selectedAddress.fullName}</p>
                    <p className="mt-1 text-sm text-muted">
                      {selectedAddress.line1}
                      {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                    </p>
                    <p className="mt-1 text-sm text-muted">{selectedAddress.phone}</p>
                  </div>

                  {list.length > 1 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Other saved addresses</p>
                      {list
                        .filter((a) => a.id !== selectedAddress.id)
                        .map((a) => (
                          <label key={a.id} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3">
                            <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                            <span className="text-sm">
                              {a.fullName}
                              {a.isDefault ? " (Default)" : ""}, {a.line1}, {a.city} {a.postalCode}
                            </span>
                          </label>
                        ))}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
                    onClick={() => setShowAddForm(true)}
                  >
                    Add a different address
                  </button>
                </div>
              ) : null}

              {(showAddForm || list.length === 0) && (
                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={form.handleSubmit((v) => addAddress.mutate(v))}
                >
                  {list.length > 0 ? (
                    <p className="md:col-span-2 text-sm text-muted">Save a new delivery address. It will be used for this order.</p>
                  ) : (
                    <p className="md:col-span-2 text-sm text-muted">Add a delivery address to continue. It will be saved for next time.</p>
                  )}
                  <div><Label>Name</Label><Input {...form.register("fullName")} /></div>
                  <div><Label>Phone</Label><Input {...form.register("phone")} /></div>
                  <div className="md:col-span-2"><Label>Address</Label><Input {...form.register("line1")} /></div>
                  <div><Label>City</Label><Input {...form.register("city")} /></div>
                  <div><Label>State</Label><Input {...form.register("state")} /></div>
                  <div><Label>PIN</Label><Input {...form.register("postalCode")} /></div>
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

              <Button onClick={goNext} disabled={!addressId}>Continue to shipping</Button>
            </div>
          )}
          {step === 1 && (
            <div>
              <p className="font-medium">Standard shipping {q && q.shipping === 0 ? "(Free)" : ""}</p>
              <p className="mt-2 text-sm text-muted">Delivered in 2–5 business days. Free above ₹999.</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={goNext}>Continue to coupon</Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <Label>Coupon code</Label>
              <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
              <Button variant="outline" type="button" onClick={() => couponCode.trim() && applyCoupon.mutate(couponCode.trim())}>
                Apply
              </Button>
              {appliedCoupon && <Button variant="ghost" type="button" onClick={() => { setAppliedCoupon(""); setCouponCode(""); }}>Remove coupon</Button>}
              {q?.coupon && <Toast message={`Applied ${q.coupon.code}`} />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" onClick={goNext}>Continue to payment</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Cash on Delivery</p>
              <p className="text-sm text-muted">Pay when your order arrives. Online payment will be added in a future update.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={goNext}>Review order</Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Address</p>
                <p className="mt-1 text-muted">
                  {selectedAddress
                    ? `${selectedAddress.fullName}, ${selectedAddress.line1}, ${selectedAddress.city} ${selectedAddress.postalCode}`
                    : "No address selected"}
                </p>
              </div>
              <div>
                <p className="font-medium">Shipping</p>
                <p className="mt-1 text-muted">Standard · 2–5 business days</p>
              </div>
              <div>
                <p className="font-medium">Coupon</p>
                <p className="mt-1 text-muted">{q?.coupon?.code ?? "None"}</p>
              </div>
              <div>
                <p className="font-medium">Payment</p>
                <p className="mt-1 text-muted">Cash on Delivery</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button disabled={place.isPending || !addressId} onClick={() => place.mutate()}>Place order</Button>
              </div>
            </div>
          )}
        </div>
        <aside className="h-fit rounded-xl border border-line bg-white p-5 text-sm">
          {q?.cart.items.map((i, idx) => (
            <p key={idx} className="flex justify-between py-1"><span>{i.name} × {i.quantity}</span><span>{formatINR(i.price * i.quantity)}</span></p>
          ))}
          <hr className="my-3" />
          <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(q?.cart.subtotal ?? 0)}</span></p>
          <p className="flex justify-between"><span>Discount</span><span>-{formatINR(q?.discount ?? 0)}</span></p>
          <p className="flex justify-between"><span>Tax</span><span>{formatINR(q?.tax ?? 0)}</span></p>
          <p className="flex justify-between"><span>Shipping</span><span>{formatINR(q?.shipping ?? 0)}</span></p>
          <p className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{formatINR(q?.total ?? 0)}</span></p>
        </aside>
      </div>
    </div>
  );
}
