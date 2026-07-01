import { prisma } from "@/lib/prisma";
import { accessibleGroupWhere } from "@/lib/authz";
import type { SessionUser } from "@/lib/session";

/**
 * A portable snapshot of everything the user can access. Includes DB secret
 * *references* (Vault paths / env names) — never secret values, which the app
 * never stores.
 */
export async function buildExport(user: SessionUser) {
  const groupWhere = await accessibleGroupWhere(user);
  const groups = await prisma.group.findMany({
    where: groupWhere,
    orderBy: { path: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      parentId: true,
      sortOrder: true,
    },
  });

  const entries = await prisma.entry.findMany({
    where: { group: groupWhere },
    include: { tags: { include: { tag: true } } },
    orderBy: { name: "asc" },
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    groups,
    entries: entries.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      description: e.description,
      groupId: e.groupId,
      environment: e.environment,
      url: e.url,
      dbEngine: e.dbEngine,
      dbHost: e.dbHost,
      dbPort: e.dbPort,
      dbName: e.dbName,
      dbUser: e.dbUser,
      secretProvider: e.secretProvider,
      secretRef: e.secretRef,
      hostname: e.hostname,
      ipAddress: e.ipAddress,
      sshPort: e.sshPort,
      sshUser: e.sshUser,
      serviceUrl: e.serviceUrl,
      healthCheckUrl: e.healthCheckUrl,
      contentMd: e.contentMd,
      tags: e.tags.map((t) => t.tag.name),
    })),
  };
}
