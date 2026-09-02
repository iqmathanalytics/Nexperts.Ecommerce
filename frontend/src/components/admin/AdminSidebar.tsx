"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Images,
  LayoutDashboard,
  Layers,
  LogOut,
  ScrollText,
  Shield,
  Shirt,
  ShoppingBag,
  Star,
  Tag,
  Ticket,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { adminNav, isAdminNavActive } from "@/lib/adminNav";
import { SITE_NAME, cn } from "@/lib/utils";
import type { User } from "@/lib/types";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/analytics": BarChart3,
  "/admin/products": Shirt,
  "/admin/categories": Layers,
  "/admin/brands": Tag,
  "/admin/collections": Images,
  "/admin/lookbooks": BookOpen,
  "/admin/inventory": Warehouse,
  "/admin/orders": ShoppingBag,
  "/admin/customers": Users,
  "/admin/coupons": Ticket,
  "/admin/reviews": Star,
  "/admin/users": Shield,
  "/admin/logs": ScrollText,
};

function initials(user: User) {
  const a = user.firstName?.trim()?.[0] ?? "";
  const b = user.lastName?.trim()?.[0] ?? "";
  const pair = `${a}${b}`.toUpperCase();
  if (pair) return pair;
  return (user.email?.[0] ?? "A").toUpperCase();
}

function NavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const path = usePathname();
  const active = isAdminNavActive(path, href);
  const Icon = NAV_ICONS[href];
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        active ? "bg-white/12 text-white shadow-[inset_3px_0_0_0_var(--accent)]" : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {Icon ? <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "opacity-80")} /> : null}
      <span>{label}</span>
    </Link>
  );
}

export function AdminSidebar({
  open,
  onClose,
  onLogout,
  user,
  overlay,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: User;
  overlay?: boolean;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex h-screen w-72 flex-col bg-brand-deep text-white shadow-[8px_0_32px_-18px_rgba(16,24,20,0.55)] transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-5 py-5">
        <div>
          <p className="nexperts-mark text-[10px] text-accent">{SITE_NAME}</p>
          <p className="mt-2 font-display text-2xl leading-none text-white">Studio</p>
          <p className="mt-1.5 text-xs text-white/50">Store operations</p>
        </div>
        {overlay ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="admin-nav flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Overview</p>
        <NavLink href="/admin" label="Dashboard" onNavigate={overlay ? onClose : undefined} />
        <NavLink href="/admin/analytics" label="Analytics" onNavigate={overlay ? onClose : undefined} />

        {adminNav.map((section) => (
          <div key={section.title} className="mt-5">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} onNavigate={overlay ? onClose : undefined} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
            {initials(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-[11px] text-white/45">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
