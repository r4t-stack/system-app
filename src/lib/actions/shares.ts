"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { assertGroupPermission, getUserTeamIds } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import {
  shareWithUserSchema,
  shareWithTeamSchema,
} from "@/lib/validation/share";
import { actionError, actionOk, type ActionResult } from "./types";

/** Grant a user (by email) a permission on a group's subtree. Requires ADMIN. */
export async function shareGroupWithUser(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = shareWithUserSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }
  const { groupId, email, permission } = parsed.data;
  await assertGroupPermission(user, groupId, "ADMIN");

  const target = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!target) return actionError("No user with that email");
  if (target.id === user.id) {
    return actionError("You already own or manage this group");
  }

  await prisma.share.upsert({
    where: { groupId_toUserId: { groupId, toUserId: target.id } },
    update: { permission },
    create: { groupId, toUserId: target.id, permission, createdById: user.id },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "share",
    entityType: "group",
    entityId: groupId,
    groupId,
    diff: { toUser: email, permission },
  });

  revalidatePath("/", "layout");
  return actionOk();
}

/** Grant a team a permission on a group's subtree. Requires ADMIN. */
export async function shareGroupWithTeam(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = shareWithTeamSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid input");
  const { groupId, teamId, permission } = parsed.data;
  await assertGroupPermission(user, groupId, "ADMIN");

  await prisma.share.upsert({
    where: { groupId_toTeamId: { groupId, toTeamId: teamId } },
    update: { permission },
    create: { groupId, toTeamId: teamId, permission, createdById: user.id },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "share",
    entityType: "group",
    entityId: groupId,
    groupId,
    diff: { toTeam: teamId, permission },
  });

  revalidatePath("/", "layout");
  return actionOk();
}

/** Remove a share. Requires ADMIN on the share's group. */
export async function removeShare(shareId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (typeof shareId !== "string") return actionError("Invalid id");

  const share = await prisma.share.findUnique({
    where: { id: shareId },
    select: { id: true, groupId: true },
  });
  if (!share) return actionOk(); // already gone
  await assertGroupPermission(user, share.groupId, "ADMIN");

  await prisma.share.delete({ where: { id: shareId } });

  await writeAuditLog({
    actorId: user.id,
    action: "unshare",
    entityType: "group",
    entityId: share.groupId,
    groupId: share.groupId,
  });

  revalidatePath("/", "layout");
  return actionOk();
}

// Kept for symmetry with UI needs.
export async function myTeamIds(): Promise<string[]> {
  const user = await requireUser();
  return getUserTeamIds(user.id);
}
