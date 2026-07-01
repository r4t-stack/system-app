import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { buildPath, depthFromPath } from "../src/lib/tree";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("password123", {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      role: "ADMIN",
      passwordHash,
    },
  });

  // A second user to exercise sharing.
  const teammate = await prisma.user.upsert({
    where: { email: "teammate@example.com" },
    update: {},
    create: {
      email: "teammate@example.com",
      name: "Teammate",
      role: "MEMBER",
      passwordHash,
    },
  });

  // Skip if already seeded.
  const existing = await prisma.group.count({ where: { ownerId: demo.id } });
  if (existing > 0) {
    console.log("Seed data already present, skipping group/entry creation.");
    return;
  }

  // Helper to create a group and set its materialized path afterwards.
  async function makeGroup(
    name: string,
    parent: { id: string; path: string } | null,
    sortOrder = 0,
    color?: string,
  ) {
    const g = await prisma.group.create({
      data: { name, ownerId: demo.id, parentId: parent?.id ?? null, sortOrder, color },
    });
    const path = buildPath(parent?.path ?? null, g.id);
    return prisma.group.update({
      where: { id: g.id },
      data: { path, depth: depthFromPath(path) },
    });
  }

  const acme = await makeGroup("Acme Platform", null, 0, "#6366f1");
  const prod = await makeGroup("Production", acme, 0, "#ef4444");
  const staging = await makeGroup("Staging", acme, 1, "#f59e0b");
  const tooling = await makeGroup("Tooling", null, 1, "#10b981");

  await prisma.entry.createMany({
    data: [
      {
        type: "LINK",
        name: "Grafana",
        url: "https://grafana.acme.internal",
        description: "Prod dashboards",
        environment: "PROD",
        groupId: prod.id,
        createdById: demo.id,
        searchText: "grafana prod dashboards grafana.acme.internal",
      },
      {
        type: "DB_CONNECTION",
        name: "Orders DB",
        dbEngine: "postgres",
        dbHost: "db.prod.acme.internal",
        dbPort: 5432,
        dbName: "orders",
        dbUser: "app_ro",
        secretProvider: "VAULT",
        secretRef: "secret/data/prod/orders-db#password",
        environment: "PROD",
        groupId: prod.id,
        createdById: demo.id,
        searchText: "orders db postgres db.prod.acme.internal orders",
      },
      {
        type: "HOST",
        name: "Bastion",
        hostname: "bastion.acme.internal",
        ipAddress: "10.0.0.10",
        sshPort: 22,
        sshUser: "deploy",
        environment: "PROD",
        groupId: prod.id,
        createdById: demo.id,
        searchText: "bastion ssh bastion.acme.internal 10.0.0.10",
      },
      {
        type: "SERVICE",
        name: "Orders API",
        serviceUrl: "https://api.acme.internal/orders",
        healthCheckUrl: "https://api.acme.internal/orders/health",
        environment: "STAGING",
        groupId: staging.id,
        createdById: demo.id,
        searchText: "orders api api.acme.internal",
      },
      {
        type: "NOTE",
        name: "Runbook: DB failover",
        contentMd: "# DB failover\n\n1. Promote replica\n2. Update DNS\n3. Verify",
        groupId: tooling.id,
        createdById: demo.id,
        searchText: "runbook db failover promote replica dns",
      },
    ],
  });

  console.log(`Seeded users: ${demo.email}, ${teammate.email} (password: password123)`);
  console.log("Seeded groups: Acme Platform > Production/Staging, Tooling");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
