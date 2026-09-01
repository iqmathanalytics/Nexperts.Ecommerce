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
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{section ?? "Administration"}</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description ?? "This module is planned for a later phase. Core catalog, orders, inventory, and customer tools are available now."}
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <p className="text-sm text-slate-500">Coming soon</p>
        <Link href="/admin" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
