"use client";

import dynamic from "next/dynamic";
import { PageFade } from "@/components/store/PageFade";
import { Header, Footer } from "@/components/store/Header";
import { OpeningScreen } from "@/components/store/OpeningScreen";
import type { ReactNode } from "react";

const OfferPopups = dynamic(() => import("@/components/store/OfferPopups").then((m) => m.OfferPopups), { ssr: false });

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <OpeningScreen />
      <Header />
      <main className="flex-1 text-ink">
        <PageFade>{children}</PageFade>
      </main>
      <Footer />
      <OfferPopups />
    </div>
  );
}
