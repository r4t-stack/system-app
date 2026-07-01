import { prisma } from "@/lib/prisma";
import { accessibleGroupWhere } from "@/lib/authz";
import type { SessionUser } from "@/lib/session";

/**
 * Recent audit entries visible to the user: instance admins see everything;
 * others see actions they performed or that touched a group they can access.
 */
export async function getAuditLog(user: SessionUser, take = 100) {
  if (user.role === "ADMIN") {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { actor: { select: { email: true, name: true } } },
    });
  }

  const groupWhere = await accessibleGroupWhere(user);
  const groups = await prisma.group.findMany({
    where: groupWhere,
    select: { id: true },
  });
  const groupIds = groups.map((g) => g.id);

  return prisma.auditLog.findMany({
    where: {
      OR: [{ actorId: user.id }, { groupId: { in: groupIds } }],
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: { email: true, name: true } } },
  });
}
