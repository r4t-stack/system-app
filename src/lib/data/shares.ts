import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

/** Shares directly attached to a group (users + teams). */
export async function getGroupShares(groupId: string) {
  return prisma.share.findMany({
    where: { groupId },
    include: {
      toUser: { select: { id: true, email: true, name: true } },
      toTeam: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Teams the user belongs to, with their role and member list. */
export async function getMyTeams(user: SessionUser) {
  return prisma.team.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: {
      memberships: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}
