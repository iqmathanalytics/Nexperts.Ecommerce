import { db } from "../db";
import { auditLogs } from "../db/schema";

export async function audit(input: {
  adminUserId?: number | null;
  action: string;
  resource: string;
  resourceId?: string | number;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  await db.insert(auditLogs).values({
    adminUserId: input.adminUserId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId != null ? String(input.resourceId) : null,
    metadata: input.metadata ?? null,
    ipAddress: input.ip ?? null,
  });
}
