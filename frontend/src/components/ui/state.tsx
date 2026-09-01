import type { ReactNode } from "react";

export function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />;
}

export function PageState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-lg font-medium text-ink">{title}</p>
      {children ? <div className="text-sm text-muted">{children}</div> : null}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function Toast({ message, tone = "success" }: { message: string; tone?: "success" | "error" }) {
  return (
    <div className={`rounded-md px-3 py-2 text-sm ${tone === "success" ? "bg-brand-soft text-ink" : "bg-red-50 text-red-700"}`}>
      {message}
    </div>
  );
}
