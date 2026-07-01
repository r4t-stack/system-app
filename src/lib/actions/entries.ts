"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertGroupPermission, resolveGroupPermission, permissionMeets } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { buildSearchText } from "@/lib/search-text";
import {
  entryCreateSchema,
  entryUpdateSchema,
  type EntryCreateInput,
} from "@/lib/validation/entry";
import { actionError, actionOk, type ActionResult } from "./types";
import type { Prisma } from "@prisma/client";

/** Map a validated discriminated-union input onto Entry columns, nulling the
 *  fields that don't belong to the chosen type. */
function toEntryColumns(input: EntryCreateInput) {
  const cols: Prisma.EntryUncheckedCreateInput = {
    type: input.type,
    name: input.name,
    description: input.description || null,
    groupId: input.groupId,
    environment: input.environment ?? "NONE",
    createdById: "", // set by caller
    url: null,
    dbEngine: null,
    dbHost: null,
    dbPort: null,
    dbName: null,
    dbUser: null,
    secretProvider: null,
    secretRef: null,
    hostname: null,
    ipAddress: null,
    sshPort: null,
    sshUser: null,
    serviceUrl: null,
    healthCheckUrl: null,
    contentMd: null,
  };

  switch (input.type) {
    case "LINK":
      cols.url = input.url;
      break;
    case "DB_CONNECTION":
      cols.dbEngine = input.dbEngine;
      cols.dbHost = input.dbHost;
      cols.dbPort = input.dbPort ?? null;
      cols.dbName = input.dbName || null;
      cols.dbUser = input.dbUser || null;
      cols.secretProvider = input.secretProvider ?? "NONE";
      cols.secretRef = input.secretRef || null;
      break;
    case "HOST":
      cols.hostname = input.hostname;
      cols.ipAddress = input.ipAddress || null;
      cols.sshPort = input.sshPort ?? null;
      cols.sshUser = input.sshUser || null;
      break;
    case "SERVICE":
      cols.serviceUrl = input.serviceUrl;
      cols.healthCheckUrl = input.healthCheckUrl || null;
      break;
    case "NOTE":
      cols.contentMd = input.contentMd || null;
      break;
  }
  return cols;
}

/** Upsert tags by name and return their ids. */
async function resolveTagIds(tagNames: string[]): Promise<string[]> {
  const unique = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];
  const ids: string[] = [];
  for (const name of unique) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    ids.push(tag.id);
  }
  return ids;
}

async function nextEntrySortOrder(groupId: string): Promise<number> {
  const last = await prisma.entry.findFirst({
    where: { groupId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function createEntry(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = entryCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }
  const data = parsed.data;
  await assertGroupPermission(user, data.groupId, "WRITE");

  const cols = toEntryColumns(data);
  cols.createdById = user.id;
  cols.sortOrder = await nextEntrySortOrder(data.groupId);
  const tagNames = data.tagNames ?? [];
  cols.searchText = buildSearchText(cols, tagNames);

  const tagIds = await resolveTagIds(tagNames);

  const entry = await prisma.entry.create({
    data: {
      ...cols,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "create",
    entityType: "entry",
    entityId: entry.id,
    groupId: data.groupId,
    diff: { name: data.name, type: data.type },
  });

  revalidatePath("/", "layout");
  return actionOk({ id: entry.id });
}

export async function updateEntry(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = entryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }
  const data = parsed.data;

  const existing = await prisma.entry.findUnique({
    where: { id: data.id },
    select: { id: true, groupId: true },
  });
  if (!existing) return actionError("Entry not found");

  // Must be able to write the entry's group (and the target group, if moved).
  await assertGroupPermission(user, existing.groupId, "WRITE");
  if (data.groupId !== existing.groupId) {
    await assertGroupPermission(user, data.groupId, "WRITE");
  }

  const cols = toEntryColumns(data);
  cols.createdById = user.id; // preserved below; not overwritten
  const tagNames = data.tagNames ?? [];
  cols.searchText = buildSearchText(cols, tagNames);
  const tagIds = await resolveTagIds(tagNames);

  const { createdById: _omit, ...updateCols } = cols;
  void _omit;

  await prisma.$transaction([
    prisma.entryTag.deleteMany({ where: { entryId: data.id } }),
    prisma.entry.update({
      where: { id: data.id },
      data: {
        ...updateCols,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  ]);

  await writeAuditLog({
    actorId: user.id,
    action: "update",
    entityType: "entry",
    entityId: data.id,
    groupId: data.groupId,
    diff: { name: data.name },
  });

  revalidatePath("/", "layout");
  return actionOk();
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (typeof id !== "string") return actionError("Invalid id");

  const entry = await prisma.entry.findUnique({
    where: { id },
    select: { groupId: true },
  });
  if (!entry) return actionError("Entry not found");
  await assertGroupPermission(user, entry.groupId, "WRITE");

  await prisma.entry.delete({ where: { id } });

  await writeAuditLog({
    actorId: user.id,
    action: "delete",
    entityType: "entry",
    entityId: id,
    groupId: entry.groupId,
  });

  revalidatePath("/", "layout");
  return actionOk();
}

/** Reorder / move an entry to another group. */
export async function moveEntry(
  id: string,
  groupId: string,
  sortOrder?: number,
): Promise<ActionResult> {
  const user = await requireUser();
  const entry = await prisma.entry.findUnique({
    where: { id },
    select: { groupId: true },
  });
  if (!entry) return actionError("Entry not found");

  await assertGroupPermission(user, entry.groupId, "WRITE");
  if (groupId !== entry.groupId) {
    await assertGroupPermission(user, groupId, "WRITE");
  }

  await prisma.entry.update({
    where: { id },
    data: { groupId, ...(sortOrder !== undefined ? { sortOrder } : {}) },
  });

  revalidatePath("/", "layout");
  return actionOk();
}

// Re-export so callers can check read access without importing authz directly.
export async function canWriteGroup(groupId: string): Promise<boolean> {
  const user = await requireUser();
  const perm = await resolveGroupPermission(user, groupId);
  return permissionMeets(perm, "WRITE");
}
