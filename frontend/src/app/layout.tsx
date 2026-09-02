import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bodoni_Moda, Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SITE_NAME, API_URL } from "@/lib/utils";

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Nexperts — contemporary Woman and Man clothing. Tropical silhouettes, festive edits, and global shipping.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  let apiOrigin = "";
  try {
    apiOrigin = new URL(API_URL).origin;
  } catch {
    apiOrigin = "";
  }
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${body.variable} ${display.variable} h-full scroll-smooth antialiased`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        {apiOrigin ? <link rel="preconnect" href={apiOrigin} /> : null}
      </head>
      <body className="min-h-full bg-background font-sans text-ink antialiased [color:var(--ink)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
