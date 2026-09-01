"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AccountHome() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<{ user: User }>("/auth/me") });
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => api<unknown[]>("/orders") });
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api<unknown[]>("/addresses") });
  const wishlist = useQuery({ queryKey: ["wishlist"], queryFn: () => api<{ items: unknown[] }>("/wishlist") });
  const reviews = useQuery({ queryKey: ["my-reviews"], queryFn: () => api<unknown[]>("/reviews") });
  const user = me.data?.data.user;

  const cards = [
    { href: "/account/profile", title: "Profile", text: "Name, phone and password" },
    { href: "/account/addresses", title: "Addresses", text: `${addresses.data?.data.length ?? 0} saved` },
    { href: "/account/orders", title: "Orders", text: `${orders.data?.data.length ?? 0} placed` },
    { href: "/account/wishlist", title: "Wishlist", text: `${wishlist.data?.data.items.length ?? 0} saved` },
    { href: "/account/reviews", title: "Reviews", text: `${reviews.data?.data.length ?? 0} submitted` },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Hello, {user?.firstName}</h1>
      <p className="mt-2 text-muted">Manage your profile, password, addresses, orders, wishlist and reviews.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl border border-line bg-white p-5 text-ink hover:border-ink">
            <p className="font-medium text-ink">{c.title}</p>
            <p className="mt-1 text-sm text-muted">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
