"use client";

import { AuditLogsPage } from "@/components/admin/AuditTable";

export default function LogsPage() {
  return (
    <AuditLogsPage
      title="Audit log"
      description="Staff actions across the store — product edits, order updates, and inventory changes."
    />
  );
}
