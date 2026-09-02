import Link from "next/link";

export function AdminPlaceholder({
  title,
  section,
  description,
}: {
  title: string;
  section?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{section ?? "Administration"}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        {description ?? "This module is planned for a later phase. Core catalog, orders, inventory, and customer tools are available now."}
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface-raised p-6">
        <p className="text-sm text-muted">Coming soon</p>
        <Link href="/admin" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
