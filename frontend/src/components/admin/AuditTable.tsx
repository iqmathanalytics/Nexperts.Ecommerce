"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input, Select } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { AdminPage, DataTable, FilterBar } from "@/components/admin/AdminTable";

type AuditLog = {
  id: number;
  action: string;
  resource: string;
  resource_id?: number;
  resourceId?: number;
  adminEmail: string;
  created_at?: string;
  createdAt?: string;
};

export function AuditTable({ description }: { description?: string }) {
  const [q, setQ] = useState("");
  const [resource, setResource] = useState("");
  const logs = useQuery({ queryKey: ["audit"], queryFn: () => api<AuditLog[]>("/admin/audit-logs") });
  const rows = useMemo(() => {
    const all = logs.data?.data ?? [];
    const query = q.trim().toLowerCase();
    return all.filter((l) => {
      const res = l.resource ?? "";
      if (resource && res !== resource) return false;
      if (!query) return true;
      return `${l.action} ${l.resource} ${l.adminEmail}`.toLowerCase().includes(query);
    });
  }, [logs.data?.data, q, resource]);
  const resources = Array.from(new Set((logs.data?.data ?? []).map((l) => l.resource).filter(Boolean)));

  return (
    <>
      {description ? <p className="shrink-0 text-sm text-slate-600">{description}</p> : null}
      <FilterBar>
        <Input className="max-w-sm" placeholder="Search action, resource, or admin" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={resource} onChange={(e) => setResource(e.target.value)} className="w-44">
          <option value="">All resources</option>
          {resources.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </FilterBar>
      <DataTable
        columns={[
          {
            id: "when",
            header: "When",
            cell: (l) => formatDateTime(l.created_at ?? l.createdAt ?? ""),
          },
          { id: "admin", header: "Admin", cell: (l) => l.adminEmail },
          { id: "action", header: "Action", cell: (l) => l.action },
          { id: "resource", header: "Resource", cell: (l) => l.resource },
          { id: "id", header: "ID", cell: (l) => l.resource_id ?? l.resourceId ?? "—" },
        ]}
        rows={rows}
        rowKey={(l) => l.id}
        loading={logs.isLoading}
        empty="No activity logs match these filters."
        footer={`${rows.length} log${rows.length === 1 ? "" : "s"}`}
      />
    </>
  );
}

export function AuditLogsPage({ title, description }: { title: string; description?: string }) {
  return (
    <AdminPage title={title}>
      <AuditTable description={description} />
    </AdminPage>
  );
}
