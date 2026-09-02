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
    { href: "/account/loyalty", title: "Loyalty", text: "Points and rewards" },
    { href: "/outfits", title: "Outfits", text: "Saved mood boards" },
    { href: "/style-quiz", title: "Style prefs", text: "Fit and style quiz" },
    { href: "/referrals", title: "Referrals", text: "Give ₹20, get ₹20" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold text-ink">Hello, {user?.firstName}</h1>
      <p className="mt-2 text-muted">Manage profile, orders, loyalty, and style preferences.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="border border-line bg-surface p-5 text-ink transition hover:border-ink">
            <p className="font-medium text-ink">{c.title}</p>
            <p className="mt-1 text-sm text-muted">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
