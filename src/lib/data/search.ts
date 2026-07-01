import { prisma } from "@/lib/prisma";
import { accessibleGroupWhere } from "@/lib/authz";
import type { SessionUser } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export type SearchFilters = {
  q?: string;
  type?: string;
  environment?: string;
  groupId?: string;
  tag?: string;
};

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

/**
 * Search accessible entries by denormalized text plus optional filters.
 *
 * On SQLite (dev) this uses a case-insensitive LIKE on `searchText`. On Postgres
 * you would swap the text predicate for a tsvector match (websearch_to_tsquery)
 * gated on DATABASE_PROVIDER; the filter/permission logic is identical.
 */
export async function searchEntries(
  user: SessionUser,
  filters: SearchFilters,
  limit = 50,
) {
  const groupWhere = await accessibleGroupWhere(user);
  const and: Prisma.EntryWhereInput[] = [{ group: groupWhere }];

  const q = filters.q?.trim().toLowerCase();
  if (q) and.push({ searchText: { contains: q } });
  if (filters.type) and.push({ type: filters.type });
  if (filters.environment) and.push({ environment: filters.environment });
  if (filters.tag) {
    and.push({ tags: { some: { tag: { name: filters.tag } } } });
  }
  if (filters.groupId) {
    const group = await prisma.group.findUnique({
      where: { id: filters.groupId },
      select: { path: true },
    });
    if (group) and.push({ group: { path: { startsWith: group.path } } });
  }

  return prisma.entry.findMany({
    where: { AND: and },
    orderBy: { name: "asc" },
    take: limit,
    select: entrySelect,
  });
}
