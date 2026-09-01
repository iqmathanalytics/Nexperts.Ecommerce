"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/state";

export function AdminPage({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>;
}

export function AdminPanel({
  title,
  toolbar,
  children,
  className,
}: {
  title?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      {title ? <h2 className="shrink-0 text-sm font-semibold text-slate-700">{title}</h2> : null}
      {toolbar}
      {children}
    </section>
  );
}

export type DataColumn<T> = {
  id: string;
  header: string;
  className?: string;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "No records found",
  loading,
  onRowClick,
  selectedKey,
  footer,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "whitespace-nowrap border-b border-slate-200 px-3 py-2.5 font-medium text-slate-600",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-10">
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = rowKey(row);
                const selected = selectedKey != null && selectedKey === key;
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-t border-slate-100",
                      onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/80",
                      selected && "bg-brand-soft/60",
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.id} className={cn("whitespace-nowrap px-3 py-2.5 align-middle", col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer ? <div className="shrink-0 border-t border-slate-200 px-3 py-2 text-xs text-slate-500">{footer}</div> : null}
    </div>
  );
}

export function AdminDrawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30" style={{ left: "var(--admin-sidebar-width, 18rem)" }} onClick={onClose}>
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="text-sm text-slate-500 hover:text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : "Request failed";
  return <p className="text-sm text-red-600">{message}</p>;
}
