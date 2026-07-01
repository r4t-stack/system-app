import { describe, it, expect } from "vitest";
import {
  buildConnectionString,
  buildDbCommands,
  buildSshCommand,
} from "./connection-string";

const RAW_PASSWORD = "S3cretPassw0rd!";

describe("buildConnectionString", () => {
  it("builds a postgres URI without any password", () => {
    const s = buildConnectionString({
      dbEngine: "postgres",
      dbHost: "db.prod",
      dbPort: 5432,
      dbName: "orders",
      dbUser: "app",
    });
    expect(s).toBe("postgresql://app@db.prod:5432/orders");
    expect(s).not.toContain(RAW_PASSWORD);
  });
});

describe("buildDbCommands", () => {
  it("wraps a Vault retrieval command, never the secret value", () => {
    const cmds = buildDbCommands({
      dbEngine: "postgres",
      dbHost: "db.prod",
      dbPort: 5432,
      dbName: "orders",
      dbUser: "app",
      secretProvider: "VAULT",
      secretRef: "secret/data/prod/db#password",
    });
    const psql = cmds.find((c) => c.label === "psql")!;
    expect(psql.value).toContain("vault kv get -field=password secret/data/prod/db");
    expect(psql.value).toContain('PGPASSWORD="$(');
  });

  it("references an env var by name for ENV provider", () => {
    const cmds = buildDbCommands({
      dbEngine: "mysql",
      dbHost: "db",
      dbUser: "root",
      secretProvider: "ENV",
      secretRef: "DB_PASSWORD",
    });
    const mysql = cmds.find((c) => c.label === "mysql")!;
    expect(mysql.value).toContain('MYSQL_PWD="$DB_PASSWORD"');
  });

  it("emits a plain command when there is no secret", () => {
    const cmds = buildDbCommands({
      dbEngine: "redis",
      dbHost: "cache",
      dbPort: 6379,
      secretProvider: "NONE",
    });
    const redis = cmds.find((c) => c.label === "redis-cli")!;
    expect(redis.value).toBe("redis-cli -h cache -p 6379");
    expect(redis.value).not.toContain("AUTH");
  });

  it("never embeds a raw password anywhere", () => {
    const cmds = buildDbCommands({
      dbEngine: "postgres",
      dbHost: "h",
      secretProvider: "AWS_SM",
      secretRef: "arn:aws:secretsmanager:us-east-1:1:secret:db",
    });
    for (const c of cmds) expect(c.value).not.toContain(RAW_PASSWORD);
  });
});

describe("buildSshCommand", () => {
  it("builds ssh with port and user", () => {
    const cmds = buildSshCommand({
      hostname: "bastion.internal",
      sshPort: 2222,
      sshUser: "deploy",
    });
    expect(cmds[0].value).toBe("ssh -p 2222 deploy@bastion.internal");
  });

  it("returns nothing without a target", () => {
    expect(buildSshCommand({})).toEqual([]);
  });
});
