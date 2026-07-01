"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveGroupPermission } from "@/lib/authz";
import { actionError, actionOk, type ActionResult } from "./types";

/** Toggle a favorite for the current user. Returns the new state. */
export async function toggleFavorite(
  entryId: string,
): Promise<ActionResult<{ favorited: boolean }>> {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { groupId: true },
  });
  if (!entry) return actionError("Entry not found");

  // Must at least be able to read the entry to favorite it.
  const perm = await resolveGroupPermission(user, entry.groupId);
  if (!perm) return actionError("Not found");

  const existing = await prisma.favorite.findUnique({
    where: { userId_entryId: { userId: user.id, entryId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/", "layout");
    return actionOk({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId: user.id, entryId } });
  revalidatePath("/", "layout");
  return actionOk({ favorited: true });
}
