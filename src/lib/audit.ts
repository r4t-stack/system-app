import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorId: string;
  action: string; // create | update | delete | move | share | unshare | ...
  entityType: string; // group | entry | share | ...
  entityId: string;
  groupId?: string | null;
  diff?: unknown; // serialized to JSON
};

/** Append an audit-log row. Never throws into the caller's transaction path. */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        groupId: input.groupId ?? null,
        diff: input.diff === undefined ? null : JSON.stringify(input.diff),
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
