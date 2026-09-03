import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MY_MONEY = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

/** Store currency (MYR). */
export function formatMoney(value: number) {
  return MY_MONEY.format(value);
}

/** @deprecated Use formatMoney — kept so existing imports keep working. */
export const formatINR = formatMoney;

export function formatCompactMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `RM ${(value / 1_000_000).toFixed(1)}m`;
  if (abs >= 1000) return `RM ${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return `RM ${Math.round(value)}`;
}

export const formatCompactINR = formatCompactMoney;

export function formatCompactNumber(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  return err instanceof Error && err.message ? err.message : fallback;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4010/api/v1";
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Nexperts";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Resolve storefront / uploaded media paths against the site origin (not the API). */
export function mediaUrl(url: string | null | undefined) {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const origin = SITE_URL.replace(/\/$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}
