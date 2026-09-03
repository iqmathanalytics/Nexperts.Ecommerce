"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/state";

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface-raised p-3 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:basis-full sm:[&>input]:basis-[16rem] [&>select]:max-w-full">
      {children}
    </div>
  );
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
      {title ? <h2 className="shrink-0 text-sm font-semibold text-ink">{title}</h2> : null}
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
    <div className="flex min-h-[22rem] flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-[0_12px_40px_-28px_rgba(28,25,21,0.45)]">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-muted/90 backdrop-blur-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "whitespace-nowrap border-b border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
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
                <td colSpan={columns.length} className="p-12">
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-muted">
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
                      "border-t border-line/70 transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-brand-soft/50" : "hover:bg-surface-muted/70",
                      selected && "bg-brand-soft",
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.id} className={cn("whitespace-nowrap px-4 py-3 align-middle", col.className)}>
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
      {footer ? <div className="shrink-0 border-t border-line bg-surface px-4 py-2.5 text-xs text-muted">{footer}</div> : null}
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
    <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:[left:var(--admin-sidebar-width,0px)]" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-[-18px_0_40px_-28px_rgba(28,25,21,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button
            type="button"
            className="rounded-lg px-2.5 py-1 text-sm text-muted transition hover:bg-surface-muted hover:text-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

/** Full-area modal for wide admin tables (inventory, etc.). */
export function AdminTableModal({
  open,
  title,
  description,
  onClose,
  toolbar,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-ink/35 p-0 backdrop-blur-[2px] sm:p-5 lg:[left:var(--admin-sidebar-width,0px)]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full flex-col overflow-hidden rounded-none border-0 border-line bg-surface shadow-[0_24px_60px_-28px_rgba(28,25,21,0.55)] sm:rounded-2xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
            {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink transition hover:border-ink hover:bg-surface-muted"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {toolbar ? <div className="shrink-0 border-b border-line px-5 py-3">{toolbar}</div> : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">{children}</div>
      </div>
    </div>
  );
}

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : "Request failed";
  return <p className="text-sm text-danger">{message}</p>;
}
