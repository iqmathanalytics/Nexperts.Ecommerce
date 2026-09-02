"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Gem, Heart, MapPin, Package, Sparkles, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AccountHome() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<{ user: User }>("/auth/me") });
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => api<unknown[]>("/orders") });
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api<unknown[]>("/addresses") });
  const wishlist = useQuery({ queryKey: ["wishlist"], queryFn: () => api<{ items: unknown[] }>("/wishlist") });
  const reviews = useQuery({ queryKey: ["my-reviews"], queryFn: () => api<unknown[]>("/reviews") });
  const user = me.data?.data.user;

  const stats = [
    { href: "/account/orders", label: "Orders", value: orders.data?.data.length ?? 0, icon: Package },
    { href: "/account/wishlist", label: "Wishlist", value: wishlist.data?.data.items.length ?? 0, icon: Heart },
    { href: "/account/addresses", label: "Addresses", value: addresses.data?.data.length ?? 0, icon: MapPin },
    { href: "/account/reviews", label: "Reviews", value: reviews.data?.data.length ?? 0, icon: Sparkles },
  ];

  const cards = [
    { href: "/account/profile", title: "Your details", text: "Name, phone and password", icon: UserRound },
    { href: "/account/addresses", title: "Addresses", text: "Saved delivery details", icon: MapPin },
    { href: "/account/loyalty", title: "Loyalty", text: "Points and RM rewards", icon: Gem },
    { href: "/style-quiz", title: "Style prefs", text: "Fit quiz for tropical wear", icon: Sparkles },
    { href: "/outfits", title: "Outfits", text: "Saved mood boards", icon: Heart },
    { href: "/referrals", title: "Referrals", text: "Give RM 20, get RM 20", icon: Sparkles },
  ];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Overview</p>
      <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Hello, {user?.firstName}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Manage your house profile, orders, and member rewards.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-[1.6rem] border border-line bg-surface px-4 py-5 transition hover:-translate-y-0.5 hover:border-brand"
            >
              <Icon className="h-4 w-4 text-brand" />
              <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-line bg-surface">
        <div className="border-b border-line px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Member details</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <dl className="grid gap-px bg-line sm:grid-cols-2">
          {[
            { k: "Email", v: user?.email ?? "—" },
            { k: "Phone", v: user?.phone || "Add a mobile number" },
            { k: "Status", v: user?.status ?? "Active" },
            { k: "Ship from", v: "House dispatch" },
          ].map((row) => (
            <div key={row.k} className="bg-surface px-6 py-4">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{row.k}</dt>
              <dd className="mt-1 text-sm text-ink">{row.v}</dd>
            </div>
          ))}
        </dl>
        <div className="px-6 py-4">
          <Link href="/account/profile" className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
            Edit details <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-start gap-4 rounded-[1.6rem] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{c.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </span>
                <span className="mt-1 block text-sm text-muted">{c.text}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
