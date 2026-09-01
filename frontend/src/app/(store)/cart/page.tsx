"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageState, Spinner, Toast } from "@/components/ui/state";
import { formatINR } from "@/lib/utils";
import { loginUrl } from "@/lib/auth";

type Cart = {
  items: Array<{
    id: number;
    name: string;
    slug: string;
    variantName: string;
    sku: string;
    quantity: number;
    price: number;
    mrp: number;
    available: number;
    imageUrl: string | null;
  }>;
  subtotal: number;
  issues: string[];
};

export default function CartPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["cart"], queryFn: () => api<Cart>("/cart") });
  const mutate = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      api(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const clear = useMutation({
    mutationFn: () => api("/cart", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const wish = useMutation({
    mutationFn: (id: number) => api(`/cart/items/${id}/wishlist`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (isError) return <PageState title="Please sign in to view your cart"><Link href={loginUrl("/cart")}>Go to login</Link></PageState>;
  const cart = data!.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-ink">
      <h1 className="text-3xl font-semibold text-ink">Cart</h1>
      {cart.issues.length > 0 && <div className="mt-4"><Toast tone="error" message={cart.issues.join(" ")} /></div>}
      {cart.items.length === 0 ? (
        <PageState title="Your cart is empty"><Link href="/products">Browse products</Link></PageState>
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-line bg-white p-4">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-24 w-24 rounded-md object-cover" /> : null}
                <div className="flex-1">
                  <Link href={`/products/${item.slug}`} className="font-medium">{item.name}</Link>
                  <p className="text-sm text-muted">{item.variantName} · {item.sku}</p>
                  <p className="mt-1 font-semibold">{formatINR(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-line disabled:opacity-40"
                      disabled={item.quantity <= 1 || mutate.isPending}
                      onClick={() => mutate.mutate({ id: item.id, quantity: item.quantity - 1 })}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-line disabled:opacity-40"
                      disabled={item.quantity >= item.available || mutate.isPending}
                      onClick={() => mutate.mutate({ id: item.id, quantity: item.quantity + 1 })}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>Remove</Button>
                    <Button size="sm" variant="ghost" disabled={wish.isPending} onClick={() => wish.mutate(item.id)}>Move to wishlist</Button>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => clear.mutate()}>Clear cart</Button>
          </div>
          <aside className="h-fit rounded-xl border border-line bg-white p-5">
            <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(cart.subtotal)}</span></p>
            <Link href="/checkout" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand text-sm font-semibold text-ink hover:bg-brand-deep">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
