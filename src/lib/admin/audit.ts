import "server-only"

import { prisma } from "@/lib/prisma"

type AuditInput = {
  actorUserId: string | null
  actorMemberId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  summary?: string | null
  metadata?: Record<string, string | number | boolean | null> | null
}

export async function writeAuditLog(input: AuditInput) {
  return prisma.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorMemberId: input.actorMemberId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
      metadata: input.metadata ?? undefined,
    },
  })
}
