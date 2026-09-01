"use client";

import { AuditLogsPage } from "@/components/admin/AuditTable";

export default function LogsPage() {
  return (
    <AuditLogsPage
      title="Logs"
      description="Recent admin activity across the store — product updates, order changes, and other actions."
    />
  );
}
