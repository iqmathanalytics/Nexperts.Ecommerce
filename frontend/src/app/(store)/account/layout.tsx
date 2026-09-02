"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Gem,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Star,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { PageState, Spinner } from "@/components/ui/state";
import type { ReactNode } from "react";
import { loginUrl } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Details", icon: UserRound },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/loyalty", label: "Loyalty", icon: Gem },
  { href: "/account/reviews", label: "Reviews", icon: Star },
];

function initials(user?: User) {
  const a = user?.firstName?.[0] ?? "";
  const b = user?.lastName?.[0] ?? "";
  return `${a}${b}`.toUpperCase() || "NX";
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<{ user: User }>("/auth/me"), retry: false });
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.clear();
      router.push("/");
    },
  });

  if (me.isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  if (me.isError)
    return (
      <PageState title="Please sign in">
        <Link href={loginUrl(path)} className="btn-store rounded-full bg-[#1c1915] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#2a2620]">
          Sign in
        </Link>
      </PageState>
    );

  const user = me.data?.data.user;

  return (
    <div className="bg-background text-ink">
      <section className="border-b border-line bg-brand text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-4 py-8 md:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent font-display text-2xl font-semibold text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]">
            {initials(user)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80">House member</p>
            <h1 className="mt-1 truncate font-display text-3xl font-semibold md:text-4xl">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="mt-1 truncate text-sm text-white/70">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6 md:py-12">
        <aside className="h-fit rounded-[1.8rem] border border-line bg-surface p-3">
          <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-none md:flex-col md:overflow-visible md:pb-0">
            {links.map((l) => {
                  const active = path === l.href || (l.href !== "/account" && path.startsWith(`${l.href}/`));
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-full px-3 py-2.5 text-sm transition md:w-full",
                    active ? "bg-brand text-white" : "text-muted hover:bg-brand-soft hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
