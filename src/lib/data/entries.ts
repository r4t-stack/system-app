import { prisma } from "@/lib/prisma";
import { resolveGroupPermission } from "@/lib/authz";
import type { SessionUser } from "@/lib/session";

/** Load an entry with its group + tags, enforcing READ on the group. */
export async function getEntry(user: SessionUser, id: string) {
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!entry) return null;

  const permission = await resolveGroupPermission(user, entry.groupId);
  if (!permission) return null;

  return {
    entry,
    permission,
    tagNames: entry.tags.map((t) => t.tag.name),
  };
}
