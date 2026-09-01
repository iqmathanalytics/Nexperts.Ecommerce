import type { ReactNode } from "react";
import { Footer } from "@/components/store/Header";
import { Header } from "@/components/store/Header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <Header />
      <main className="flex-1 text-ink">{children}</main>
      <Footer />
    </div>
  );
}
