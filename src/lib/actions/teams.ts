"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createTeamSchema } from "@/lib/validation/share";
import { actionError, actionOk, type ActionResult } from "./types";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "team"
  );
}

export async function createTeam(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }

  let slug = slugify(parsed.data.name);
  if (await prisma.team.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.floor(performance.now()) % 10000}`;
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      slug,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  revalidatePath("/settings/teams");
  return actionOk({ id: team.id });
}

/** Add a member (by email). Requires the actor to be OWNER/ADMIN of the team. */
export async function addTeamMember(
  teamId: string,
  email: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const actor = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    select: { role: true },
  });
  if (!actor || !["OWNER", "ADMIN"].includes(actor.role)) {
    return actionError("You cannot manage this team");
  }

  const target = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!target) return actionError("No user with that email");

  await prisma.teamMembership.upsert({
    where: { userId_teamId: { userId: target.id, teamId } },
    update: {},
    create: { userId: target.id, teamId, role: "MEMBER" },
  });

  revalidatePath("/settings/teams");
  return actionOk();
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const actor = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    select: { role: true },
  });
  // Users may remove themselves; OWNER/ADMIN may remove others.
  const isSelf = userId === user.id;
  if (!actor || (!isSelf && !["OWNER", "ADMIN"].includes(actor.role))) {
    return actionError("You cannot manage this team");
  }

  await prisma.teamMembership.deleteMany({ where: { teamId, userId } });
  revalidatePath("/settings/teams");
  return actionOk();
}
