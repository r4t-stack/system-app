"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation/auth";
import { actionError, actionOk, type ActionResult } from "./types";

/** Create a new user account. Does not sign the user in. */
export async function registerUser(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid details", parsed.error.flatten().fieldErrors);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return actionError("An account with that email already exists");
  }

  const passwordHash = await hashPassword(parsed.data.password);

  // First registered user becomes the instance admin.
  const userCount = await prisma.user.count();
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      role: userCount === 0 ? "ADMIN" : "MEMBER",
    },
  });

  return actionOk({ email });
}
