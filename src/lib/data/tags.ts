import { prisma } from "@/lib/prisma";
import { accessibleGroupWhere } from "@/lib/authz";
import type { SessionUser } from "@/lib/session";

const entrySelect = {
  id: true,
  name: true,
  type: true,
  environment: true,
  url: true,
  dbHost: true,
  hostname: true,
  serviceUrl: true,
  group: { select: { id: true, name: true } },
} as const;

/** Accessible entries tagged with `tagName`. */
export async function getEntriesByTag(user: SessionUser, tagName: string) {
  const groupWhere = await accessibleGroupWhere(user);
  return prisma.entry.findMany({
    where: {
      group: groupWhere,
      tags: { some: { tag: { name: tagName } } },
    },
    orderBy: { name: "asc" },
    select: entrySelect,
  });
}

/** All tags with how many accessible entries use them. */
export async function getAllTags(user: SessionUser) {
  const groupWhere = await accessibleGroupWhere(user);
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      _count: {
        select: { entries: { where: { entry: { group: groupWhere } } } },
      },
    },
  });
  return tags
    .map((t) => ({ id: t.id, name: t.name, color: t.color, count: t._count.entries }))
    .filter((t) => t.count > 0);
}
