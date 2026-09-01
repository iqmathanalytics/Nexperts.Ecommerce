"use client";

import { notFound, useParams } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { AuditLogsPage } from "@/components/admin/AuditTable";

export default function UsersViewPage() {
  const { view } = useParams<{ view: string }>();

  if (view === "roles") {
    return (
      <AdminPlaceholder
        title="Roles & Permissions"
        section="Administration"
        description="Fine-grained role and permission editing will expand on the current RBAC model."
      />
    );
  }

  if (view === "activity-logs") {
    return <AuditLogsPage title="Activity Logs" description="Recent admin actions across the store." />;
  }

  notFound();
}
