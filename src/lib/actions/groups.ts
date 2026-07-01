"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertGroupPermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { buildPath, depthFromPath, isAncestorPath } from "@/lib/tree";
import {
  createGroupSchema,
  updateGroupSchema,
  moveGroupSchema,
} from "@/lib/validation/group";
import { actionError, actionOk, type ActionResult } from "./types";

async function nextSortOrder(
  ownerId: string,
  parentId: string | null,
): Promise<number> {
  const last = await prisma.group.findFirst({
    where: { parentId, ownerId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function createGroup(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }
  const { name, description, color, parentId } = parsed.data;

  let parentPath: string | null = null;
  if (parentId) {
    await assertGroupPermission(user, parentId, "WRITE");
    const parent = await prisma.group.findUnique({
      where: { id: parentId },
      select: { path: true },
    });
    if (!parent) return actionError("Parent group not found");
    parentPath = parent.path;
  }

  const group = await prisma.group.create({
    data: {
      name,
      description: description || null,
      color: color || null,
      parentId: parentId ?? null,
      ownerId: user.id,
      sortOrder: await nextSortOrder(user.id, parentId ?? null),
    },
  });

  const path = buildPath(parentPath, group.id);
  await prisma.group.update({
    where: { id: group.id },
    data: { path, depth: depthFromPath(path) },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "group",
    entityId: group.id,
    groupId: group.id,
    diff: { name },
  });

  revalidatePath("/", "layout");
  return actionOk({ id: group.id });
}

export async function updateGroup(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateGroupSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }
  const { id, name, description, color } = parsed.data;
  await assertGroupPermission(user, id, "WRITE");

  await prisma.group.update({
    where: { id },
    data: { name, description: description || null, color: color || null },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "update",
    entityType: "group",
    entityId: id,
    groupId: id,
    diff: { name },
  });

  revalidatePath("/", "layout");
  return actionOk();
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (typeof id !== "string") return actionError("Invalid id");
  await assertGroupPermission(user, id, "ADMIN");

  // Cascades to children + entries via the schema's onDelete: Cascade.
  await prisma.group.delete({ where: { id } });

  await writeAuditLog({
    actorId: user.id,
    action: "delete",
    entityType: "group",
    entityId: id,
    groupId: null,
  });

  revalidatePath("/", "layout");
  return actionOk();
}

/**
 * Move a group under a new parent (or to the root) and rewrite the materialized
 * path + depth of the group and its entire subtree. Prevents cycles.
 */
export async function moveGroup(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = moveGroupSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid input");
  const { id, parentId, sortOrder } = parsed.data;

  await assertGroupPermission(user, id, "WRITE");

  const group = await prisma.group.findUnique({
    where: { id },
    select: { id: true, path: true, depth: true, parentId: true },
  });
  if (!group) return actionError("Group not found");

  let newParentPath = "/";
  if (parentId) {
    if (parentId === id) return actionError("A group cannot be its own parent");
    await assertGroupPermission(user, parentId, "WRITE");
    const parent = await prisma.group.findUnique({
      where: { id: parentId },
      select: { path: true },
    });
    if (!parent) return actionError("Target parent not found");
    // Cannot move a group into its own subtree.
    if (isAncestorPath(group.path, parent.path)) {
      return actionError("Cannot move a group into its own subtree");
    }
    newParentPath = parent.path;
  }

  const newPath = buildPath(newParentPath === "/" ? null : newParentPath, id);
  const newDepth = depthFromPath(newPath);
  const depthDelta = newDepth - group.depth;

  // All descendants (self excluded) share the old path prefix.
  const descendants = await prisma.group.findMany({
    where: { path: { startsWith: group.path }, id: { not: id } },
    select: { id: true, path: true, depth: true },
  });

  await prisma.$transaction([
    prisma.group.update({
      where: { id },
      data: {
        parentId: parentId ?? null,
        path: newPath,
        depth: newDepth,
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    }),
    ...descendants.map((d) =>
      prisma.group.update({
        where: { id: d.id },
        data: {
          path: newPath + d.path.slice(group.path.length),
          depth: d.depth + depthDelta,
        },
      }),
    ),
  ]);

  await writeAuditLog({
    actorId: user.id,
    action: "move",
    entityType: "group",
    entityId: id,
    groupId: id,
    diff: { from: group.parentId, to: parentId ?? null },
  });

  revalidatePath("/", "layout");
  return actionOk();
}
