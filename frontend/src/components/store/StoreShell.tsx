"use client";

import { OpeningScreen } from "@/components/store/OpeningScreen";
import { PageFade } from "@/components/store/PageFade";
import { Header, Footer } from "@/components/store/Header";
import { SupportChatSlot } from "@/components/store/SupportChatSlot";
import type { ReactNode } from "react";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <OpeningScreen />
      <Header />
      <main className="flex-1 text-ink">
        <PageFade>{children}</PageFade>
      </main>
      <Footer />
      <SupportChatSlot />
    </div>
  );
}
