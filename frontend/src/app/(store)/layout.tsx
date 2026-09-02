import { Suspense, type ReactNode } from "react";
import { StoreShell } from "@/components/store/StoreShell";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <StoreShell>
      <Suspense fallback={<div className="min-h-[100svh] bg-background" aria-hidden />}>
        {children}
      </Suspense>
    </StoreShell>
  );
}
