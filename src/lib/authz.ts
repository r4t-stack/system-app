import { prisma } from "@/lib/prisma";
import { pathIds } from "@/lib/tree";
import { PERMISSION_RANK, type Permission } from "@/lib/constants";
import type { SessionUser } from "@/lib/session";

/** Team ids the user belongs to. */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

function strongest(perms: Permission[]): Permission | null {
  let best: Permission | null = null;
  for (const p of perms) {
    if (!best || PERMISSION_RANK[p] > PERMISSION_RANK[best]) best = p;
  }
  return best;
}

/**
 * Resolve the effective permission a user has on a group (and thus its subtree).
 * Considers: ownership, instance admin, and shares targeting the group OR any
 * ancestor, addressed to the user directly or to a team they belong to.
 * Returns null when the user has no access.
 */
export async function resolveGroupPermission(
  user: SessionUser,
  groupId: string,
): Promise<Permission | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true, path: true },
  });
  if (!group) return null;

  if (group.ownerId === user.id) return "ADMIN";
  if (user.role === "ADMIN") return "ADMIN"; // instance admin

  const teamIds = await getUserTeamIds(user.id);
  // A share applies if its group is this group or an ancestor of it.
  const idsOnPath = pathIds(group.path);
  const shares = await prisma.share.findMany({
    where: {
      groupId: { in: idsOnPath },
      OR: [
        { toUserId: user.id },
        ...(teamIds.length ? [{ toTeamId: { in: teamIds } }] : []),
      ],
    },
    select: { permission: true },
  });

  return strongest(shares.map((s) => s.permission as Permission));
}

/** True if `have` meets or exceeds `min`. */
export function permissionMeets(
  have: Permission | null,
  min: Permission,
): boolean {
  return !!have && PERMISSION_RANK[have] >= PERMISSION_RANK[min];
}

/** Throw if the user lacks `min` permission on the group. */
export async function assertGroupPermission(
  user: SessionUser,
  groupId: string,
  min: Permission,
): Promise<Permission> {
  const perm = await resolveGroupPermission(user, groupId);
  if (!permissionMeets(perm, min)) {
    throw new Error("You do not have permission to perform this action");
  }
  return perm as Permission;
}

/**
 * Prisma `where` fragment selecting every group the user may at least READ:
 * groups they own, plus any group inside a subtree shared with them or a team.
 * Instance admins see everything.
 */
export async function accessibleGroupWhere(user: SessionUser) {
  if (user.role === "ADMIN") return {};

  const teamIds = await getUserTeamIds(user.id);
  const shares = await prisma.share.findMany({
    where: {
      OR: [
        { toUserId: user.id },
        ...(teamIds.length ? [{ toTeamId: { in: teamIds } }] : []),
      ],
    },
    select: { group: { select: { path: true } } },
  });

  const sharedPrefixes = shares.map((s) => s.group.path);
  return {
    OR: [
      { ownerId: user.id },
      ...sharedPrefixes.map((prefix) => ({ path: { startsWith: prefix } })),
    ],
  };
}
