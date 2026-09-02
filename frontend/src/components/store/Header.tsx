"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { SITE_NAME } from "@/lib/utils";
import { loginUrl } from "@/lib/auth";
import { useSession } from "@/hooks/useSession";
import { useStoreUi } from "@/components/store/StoreUiContext";
import { MiniCart } from "@/components/store/MiniCart";
import { SearchOverlay } from "@/components/store/SearchOverlay";
import { MobileTabBar } from "@/components/store/MobileTabBar";
import type { CategoryNode } from "@/lib/types";
import { MEGA_MEN, MEGA_WOMEN } from "@/lib/editorial";
import Image from "next/image";
import { OfferTheatre } from "@/components/store/OfferTheatre";

/** Zara / H&M primary IA */
const PRIMARY = [
  { href: "/women", label: "Woman", mega: "women" as const },
  { href: "/men", label: "Man", mega: "men" as const },
  { href: "/products?sort=newest", label: "New", mega: null },
  { href: "/sale", label: "Sale", mega: null },
];

const WOMEN_LINKS = [
  { href: "/women", label: "View all" },
  { href: "/category/dresses", label: "Dresses" },
  { href: "/category/tops", label: "Tops & shirts" },
  { href: "/category/bottoms", label: "Trousers" },
  { href: "/category/ethnic-wear", label: "Ethnic wear" },
  { href: "/category/outerwear", label: "Outerwear" },
  { href: "/collections/seasonal/festive", label: "Festive edit" },
];

const MEN_LINKS = [
  { href: "/men", label: "View all" },
  { href: "/category/tops", label: "Shirts & tops" },
  { href: "/category/bottoms", label: "Trousers" },
  { href: "/category/outerwear", label: "Jackets" },
  { href: "/products?gender=MEN&sort=newest", label: "New in" },
];

export function Header() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState<"women" | "men" | null>(null);
  const { isAuthenticated } = useSession();
  const { openSearch, openMiniCart, cartPulse } = useStoreUi();
  const isHome = path === "/";

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ items: unknown[] }>("/cart"),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 15_000,
  });
  const wishlist = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api<{ items: unknown[] }>("/wishlist"),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 15_000,
  });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<CategoryNode[]>("/categories"),
    staleTime: 10 * 60_000,
  });

  const cartCount = cart.data?.data.items.length ?? 0;
  const wishCount = wishlist.data?.data.items.length ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMega(null);
  }, [path]);

  const solid = !isHome || scrolled || mobileOpen || mega;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solid ? "border-b border-line bg-white/98 text-ink backdrop-blur-sm" : "bg-transparent text-white"
        }`}
        onMouseLeave={() => setMega(null)}
      >
        <OfferTheatre />
        {/* Utility strip — H&M/Uniqlo style */}
        <div
          className={`hidden border-b text-[10px] uppercase tracking-[0.18em] md:block ${
            solid ? "border-line bg-surface-muted text-muted" : "border-white/10 bg-black/20 text-white/80"
          }`}
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-1.5">
            <p>Free shipping over ₹999 · Easy 7-day returns</p>
            <div className="flex gap-5">
              <Link href="/faq" className="hover:opacity-100 opacity-80">
                Help
              </Link>
              <Link href="/store-finder" className="hover:opacity-100 opacity-80">
                Find a store
              </Link>
              <Link href={isAuthenticated ? "/account" : "/login"} className="hover:opacity-100 opacity-80">
                {isAuthenticated ? "My account" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-sm p-2 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden items-center gap-0 lg:flex">
              {PRIMARY.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onMouseEnter={() => setMega(l.mega)}
                  className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                    l.label === "Sale"
                      ? "animate-sale-pulse text-danger"
                      : path.startsWith(l.href.split("?")[0]!)
                        ? "opacity-100"
                        : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" className="nexperts-mark text-center text-[1.05rem] md:text-xl">
            {SITE_NAME}
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <button type="button" onClick={openSearch} className="rounded-sm p-2 transition hover:bg-black/5" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={isAuthenticated ? "/account/wishlist" : loginUrl("/account/wishlist")}
              className="relative hidden rounded-sm p-2 transition hover:bg-black/5 sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                  {wishCount}
                </span>
              ) : null}
            </Link>
            <motion.button
              type="button"
              key={cartPulse}
              animate={cartPulse ? { scale: [1, 1.12, 1] } : undefined}
              onClick={openMiniCart}
              className="relative rounded-sm p-2 transition hover:bg-black/5"
              aria-label="Bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </motion.button>
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              className="hidden rounded-sm p-2 transition hover:bg-black/5 sm:inline-flex"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Mega menu — Zara/H&M */}
        <AnimatePresence>
          {mega ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute inset-x-0 top-full border-b border-line bg-white text-ink shadow-sm"
            >
              <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-10 md:grid-cols-[220px_1fr]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                    {mega === "women" ? "Woman" : "Man"}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {(mega === "women" ? WOMEN_LINKS : MEN_LINKS).map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="text-sm transition hover:underline">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(mega === "women" ? MEGA_WOMEN : MEGA_MEN).map((c) => (
                    <Link key={c.href} href={c.href} className="group relative aspect-[4/5] overflow-hidden bg-surface-muted">
                      <Image
                        src={c.image}
                        alt={c.label}
                        fill
                        quality={70}
                        sizes="240px"
                        className="object-cover object-[center_12%] transition duration-700 group-hover:scale-[1.06]"
                      />
                      <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        {c.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Mobile full menu */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-white text-ink lg:hidden">
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <span className="nexperts-mark text-sm">{SITE_NAME}</span>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="px-4 py-2">
            {PRIMARY.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between border-b border-line py-4 text-sm font-semibold uppercase tracking-[0.18em]">
                {l.label}
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
            {(cats.data?.data ?? []).map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="block border-b border-line py-4 text-sm text-muted">
                {c.name}
              </Link>
            ))}
            <Link href="/style-quiz" className="block border-b border-line py-4 text-sm">
              Style quiz
            </Link>
            <Link href="/outfits" className="block border-b border-line py-4 text-sm">
              Outfit builder
            </Link>
          </nav>
        </div>
      ) : null}

      <SearchOverlay />
      <MiniCart />
      <MobileTabBar />
      <div className={isHome ? "h-0" : "h-[6.75rem] md:h-[8.75rem]"} aria-hidden />
    </>
  );
}

export function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";
  return (
    <footer className="mt-auto border-t border-line bg-white pb-20 text-ink md:pb-0">
      <div className="border-b border-line bg-surface-muted">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Newsletter</p>
            <p className="mt-1 text-sm text-muted">New drops, member offers, and styling notes.</p>
          </div>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="email"
              required
              placeholder="Email address"
              className="h-11 flex-1 border border-line bg-white px-3 text-sm outline-none focus:border-ink"
            />
            <button type="submit" className="h-11 bg-ink px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-5 md:px-6">
        <div className="md:col-span-2">
          <p className="nexperts-mark text-lg">{SITE_NAME}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Contemporary clothing for India — Woman, Man, and seasonal edits. Designed for clarity, fit, and everyday luxury.
          </p>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex text-[11px] font-semibold uppercase tracking-[0.18em] underline-offset-4 hover:underline"
          >
            WhatsApp support
          </a>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Shop</p>
          <Link href="/women" className="block text-sm hover:underline">
            Woman
          </Link>
          <Link href="/men" className="mt-2.5 block text-sm hover:underline">
            Man
          </Link>
          <Link href="/products?sort=newest" className="mt-2.5 block text-sm hover:underline">
            New in
          </Link>
          <Link href="/sale" className="mt-2.5 block text-sm hover:underline">
            Sale
          </Link>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Help</p>
          <Link href="/faq" className="block text-sm hover:underline">
            FAQ & size guide
          </Link>
          <Link href="/contact" className="mt-2.5 block text-sm hover:underline">
            Contact
          </Link>
          <Link href="/store-finder" className="mt-2.5 block text-sm hover:underline">
            Find a store
          </Link>
          <p className="mt-4 text-sm text-muted">Shipping 2–5 days</p>
          <p className="mt-1 text-sm text-muted">7-day returns</p>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">About</p>
          <Link href="/style-quiz" className="block text-sm hover:underline">
            Style quiz
          </Link>
          <Link href="/account/loyalty" className="mt-2.5 block text-sm hover:underline">
            Member rewards
          </Link>
          <Link href="/privacy" className="mt-2.5 block text-sm hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="mt-2.5 block text-sm hover:underline">
            Terms
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-5 text-[11px] uppercase tracking-[0.14em] text-muted md:flex-row md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} {SITE_NAME}</p>
          <p>India · INR</p>
        </div>
      </div>
    </footer>
  );
}
