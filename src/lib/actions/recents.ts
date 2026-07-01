"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

/** Record that the current user viewed an entry (upsert on viewedAt). */
export async function recordView(entryId: string): Promise<void> {
  const user = await currentUser();
  if (!user) return;
  try {
    await prisma.recentView.upsert({
      where: { userId_entryId: { userId: user.id, entryId } },
      update: { viewedAt: new Date() },
      create: { userId: user.id, entryId },
    });
  } catch {
    // Non-critical; ignore (e.g. entry deleted concurrently).
  }
}
