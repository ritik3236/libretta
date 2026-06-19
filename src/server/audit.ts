import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

/** Records an admin action in the audit feed (lb_audit_logs). */
export async function writeAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata },
  });
}
