"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { PageState } from "@/components/ui/state";
import Link from "next/link";

type Wish = { id: number; name: string; slug: string; price: number; mrp?: number; imageUrl: string | null };

export default function WishlistPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["wishlist"], queryFn: () => api<{ items: Wish[] }>("/wishlist") });
  const move = useMutation({
    mutationFn: (id: number) => api(`/wishlist/items/${id}/cart`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/wishlist/items/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
  const items = data?.data.items ?? [];
  if (!items.length) return <PageState title="Wishlist is empty"><Link href="/products">Browse products</Link></PageState>;
  return (
    <div className="text-ink">
      <h1 className="text-3xl font-semibold text-ink">Wishlist</h1>
      <p className="mt-1 text-sm text-muted">Saved products stay here until you move them to cart or remove them.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.id} className="flex gap-4 rounded-xl border border-line bg-white p-4">
            {i.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.imageUrl} alt="" className="h-20 w-20 rounded-md object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-md bg-background" />
            )}
            <div className="flex-1">
              <Link href={`/products/${i.slug}`} className="font-medium text-ink hover:underline">{i.name}</Link>
              <p className="text-sm font-semibold text-ink">{formatINR(i.price)}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => move.mutate(i.id)}>Move to cart</Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(i.id)}>Remove</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
