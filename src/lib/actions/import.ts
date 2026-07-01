"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertGroupPermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { buildPath, depthFromPath } from "@/lib/tree";
import { buildSearchText } from "@/lib/search-text";
import { parseBookmarks } from "@/lib/bookmarks";
import { actionError, actionOk, type ActionResult } from "./types";

/** Import browser bookmarks (Netscape HTML) as LINK entries into a group. */
export async function importBookmarks(
  groupId: string,
  html: string,
): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();
  if (typeof groupId !== "string" || typeof html !== "string") {
    return actionError("Invalid input");
  }
  await assertGroupPermission(user, groupId, "WRITE");

  const bookmarks = parseBookmarks(html);
  if (bookmarks.length === 0) return actionOk({ count: 0 });

  const last = await prisma.entry.findFirst({
    where: { groupId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let sortOrder = (last?.sortOrder ?? -1) + 1;

  await prisma.entry.createMany({
    data: bookmarks.map((b) => ({
      type: "LINK",
      name: b.title.slice(0, 160),
      url: b.url,
      groupId,
      createdById: user.id,
      sortOrder: sortOrder++,
      searchText: buildSearchText({ name: b.title, url: b.url }, []),
    })),
  });

  await writeAuditLog({
    actorId: user.id,
    action: "import",
    entityType: "entry",
    entityId: groupId,
    groupId,
    diff: { source: "bookmarks", count: bookmarks.length },
  });

  revalidatePath("/", "layout");
  return actionOk({ count: bookmarks.length });
}

type ExportShape = {
  groups?: Array<{
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    parentId?: string | null;
    sortOrder?: number;
  }>;
  entries?: Array<Record<string, unknown> & { id: string; groupId: string; type: string; name: string }>;
};

/** Import a JSON export, recreating its group tree (optionally under a parent). */
export async function importJson(
  parentId: string | null,
  jsonText: string,
): Promise<ActionResult<{ groups: number; entries: number }>> {
  const user = await requireUser();

  let data: ExportShape;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return actionError("Not valid JSON");
  }
  if (!Array.isArray(data.groups)) return actionError("Missing groups array");

  let parentPath: string | null = null;
  if (parentId) {
    await assertGroupPermission(user, parentId, "WRITE");
    const parent = await prisma.group.findUnique({
      where: { id: parentId },
      select: { path: true },
    });
    if (!parent) return actionError("Target group not found");
    parentPath = parent.path;
  }

  const idMap = new Map<string, string>();
  // Groups are exported in path order, so parents precede children.
  for (const g of data.groups) {
    const mappedParent = g.parentId ? idMap.get(g.parentId) ?? null : null;
    const created = await prisma.group.create({
      data: {
        name: g.name,
        description: g.description ?? null,
        color: g.color ?? null,
        ownerId: user.id,
        parentId: mappedParent ?? parentId ?? null,
        sortOrder: g.sortOrder ?? 0,
      },
    });
    // Determine this group's base path from its (already-created) parent.
    let base = parentPath;
    if (mappedParent) {
      const p = await prisma.group.findUnique({
        where: { id: mappedParent },
        select: { path: true },
      });
      base = p?.path ?? parentPath;
    }
    const path = buildPath(base, created.id);
    await prisma.group.update({
      where: { id: created.id },
      data: { path, depth: depthFromPath(path) },
    });
    idMap.set(g.id, created.id);
  }

  let entryCount = 0;
  for (const e of data.entries ?? []) {
    const newGroupId = idMap.get(e.groupId);
    if (!newGroupId) continue;
    const tagNames = Array.isArray(e.tags) ? (e.tags as string[]) : [];
    const tagRows = await Promise.all(
      tagNames.map((name) =>
        prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
      ),
    );
    await prisma.entry.create({
      data: {
        type: String(e.type),
        name: String(e.name).slice(0, 160),
        description: (e.description as string) ?? null,
        groupId: newGroupId,
        createdById: user.id,
        environment: (e.environment as string) ?? "NONE",
        url: (e.url as string) ?? null,
        dbEngine: (e.dbEngine as string) ?? null,
        dbHost: (e.dbHost as string) ?? null,
        dbPort: (e.dbPort as number) ?? null,
        dbName: (e.dbName as string) ?? null,
        dbUser: (e.dbUser as string) ?? null,
        secretProvider: (e.secretProvider as string) ?? null,
        secretRef: (e.secretRef as string) ?? null,
        hostname: (e.hostname as string) ?? null,
        ipAddress: (e.ipAddress as string) ?? null,
        sshPort: (e.sshPort as number) ?? null,
        sshUser: (e.sshUser as string) ?? null,
        serviceUrl: (e.serviceUrl as string) ?? null,
        healthCheckUrl: (e.healthCheckUrl as string) ?? null,
        contentMd: (e.contentMd as string) ?? null,
        searchText: buildSearchText(e as never, tagNames),
        tags: { create: tagRows.map((t) => ({ tagId: t.id })) },
      },
    });
    entryCount++;
  }

  await writeAuditLog({
    actorId: user.id,
    action: "import",
    entityType: "group",
    entityId: parentId ?? "root",
    groupId: parentId,
    diff: { source: "json", groups: data.groups.length, entries: entryCount },
  });

  revalidatePath("/", "layout");
  return actionOk({ groups: data.groups.length, entries: entryCount });
}
