import { prisma } from "@/lib/prisma";
import { accessibleGroupWhere, resolveGroupPermission } from "@/lib/authz";
import { buildTree } from "@/lib/tree";
import type { SessionUser } from "@/lib/session";

export type GroupTreeRow = {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  sortOrder: number;
  entryCount: number;
};

/** All groups the user can see, assembled into a nested tree for the sidebar. */
export async function getGroupTree(user: SessionUser) {
  const where = await accessibleGroupWhere(user);
  const groups = await prisma.group.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      parentId: true,
      color: true,
      sortOrder: true,
      _count: { select: { entries: true } },
    },
  });

  const rows: GroupTreeRow[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    parentId: g.parentId,
    color: g.color,
    sortOrder: g.sortOrder,
    entryCount: g._count.entries,
  }));

  return buildTree(rows);
}

/** A single group with its entries, or null if not accessible. */
export async function getGroupWithEntries(user: SessionUser, id: string) {
  const permission = await resolveGroupPermission(user, id);
  if (!permission) return null;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { tags: { include: { tag: true } } },
      },
      parent: { select: { id: true, name: true } },
    },
  });
  if (!group) return null;

  return { group, permission };
}

/** Breadcrumb ancestry (root → group) for a group id. */
export async function getGroupBreadcrumbs(id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    select: { path: true },
  });
  if (!group) return [];
  const ids = group.path.split("/").filter(Boolean);
  const groups = await prisma.group.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const byId = new Map(groups.map((g) => [g.id, g]));
  return ids.map((gid) => byId.get(gid)).filter(Boolean) as {
    id: string;
    name: string;
  }[];
}
