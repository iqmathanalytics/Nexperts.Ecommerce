import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/utils";

export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">{SITE_NAME}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <div className="prose-store mt-8 space-y-4 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}
