"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveGroupPermission } from "@/lib/authz";
import { actionError, actionOk, type ActionResult } from "./types";

/** Ping a service's health-check URL and store the result. */
export async function checkEntryHealth(
  entryId: string,
): Promise<ActionResult<{ status: string; latencyMs: number | null }>> {
  const user = await requireUser();
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { groupId: true, healthCheckUrl: true, serviceUrl: true },
  });
  if (!entry) return actionError("Entry not found");
  if (!(await resolveGroupPermission(user, entry.groupId))) {
    return actionError("Not found");
  }

  const target = entry.healthCheckUrl || entry.serviceUrl;
  if (!target) return actionError("No URL to check");

  let status = "DOWN";
  let latencyMs: number | null = null;
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    latencyMs = Date.now() - started;
    status = res.ok ? "UP" : "DOWN";
  } catch {
    latencyMs = Date.now() - started;
    status = "DOWN";
  }

  await prisma.entry.update({
    where: { id: entryId },
    data: {
      lastHealthStatus: status,
      lastHealthLatencyMs: latencyMs,
      lastCheckedAt: new Date(),
    },
  });

  revalidatePath(`/entries/${entryId}`);
  return actionOk({ status, latencyMs });
}
