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

/** Entries the user has starred (within groups they can still access). */
export async function getFavorites(user: SessionUser) {
  const groupWhere = await accessibleGroupWhere(user);
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, entry: { group: groupWhere } },
    orderBy: { createdAt: "desc" },
    include: { entry: { select: entrySelect } },
  });
  return favorites.map((f) => f.entry);
}

/** Most recently viewed entries (within accessible groups). */
export async function getRecents(user: SessionUser, take = 10) {
  const groupWhere = await accessibleGroupWhere(user);
  const recents = await prisma.recentView.findMany({
    where: { userId: user.id, entry: { group: groupWhere } },
    orderBy: { viewedAt: "desc" },
    take,
    include: { entry: { select: entrySelect } },
  });
  return recents.map((r) => r.entry);
}

/** Set of entry ids the user has favorited (for showing star state in lists). */
export async function getFavoriteIds(user: SessionUser): Promise<Set<string>> {
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { entryId: true },
  });
  return new Set(rows.map((r) => r.entryId));
}
