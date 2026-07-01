// Build copy-paste-ready connection strings and CLI commands for entries.
//
// SAFETY: this module never embeds a secret value. When a secret reference is
// present it emits a command that *retrieves* the secret at run time (from
// Vault / an env var / AWS Secrets Manager) via a shell substitution, so the
// value only ever exists in the user's own shell — never in this app.

type DbEntry = {
  dbEngine?: string | null;
  dbHost?: string | null;
  dbPort?: number | null;
  dbName?: string | null;
  dbUser?: string | null;
  secretProvider?: string | null;
  secretRef?: string | null;
};

type HostEntry = {
  hostname?: string | null;
  ipAddress?: string | null;
  sshPort?: number | null;
  sshUser?: string | null;
};

export type CopyCommand = { label: string; value: string };

/** Shell snippet that resolves the secret to stdout, for the given provider. */
function secretRetrievalExpr(
  provider: string | null | undefined,
  ref: string | null | undefined,
): string | null {
  if (!provider || provider === "NONE" || !ref) return null;
  switch (provider) {
    case "VAULT": {
      // ref like "secret/data/prod/db#password"
      const [path, field = "password"] = ref.split("#");
      return `$(vault kv get -field=${field} ${path})`;
    }
    case "ENV":
      // ref is the env var name; reference it directly.
      return `$${ref}`;
    case "AWS_SM":
      return `$(aws secretsmanager get-secret-value --secret-id ${ref} --query SecretString --output text)`;
    default:
      return null;
  }
}

/** A plain connection string with no password component. */
export function buildConnectionString(entry: DbEntry): string | null {
  const { dbEngine, dbHost, dbPort, dbName, dbUser } = entry;
  if (!dbHost) return null;
  const auth = dbUser ? `${dbUser}@` : "";
  const port = dbPort ? `:${dbPort}` : "";
  const db = dbName ? `/${dbName}` : "";

  switch (dbEngine) {
    case "postgres":
      return `postgresql://${auth}${dbHost}${port}${db}`;
    case "mysql":
      return `mysql://${auth}${dbHost}${port}${db}`;
    case "mongodb":
      return `mongodb://${auth}${dbHost}${port}${db}`;
    case "redis":
      return `redis://${dbHost}${port}`;
    default:
      return `${dbEngine ?? "db"}://${auth}${dbHost}${port}${db}`;
  }
}

/** Ready-to-run CLI command(s) for a DB connection, wiring up secret retrieval. */
export function buildDbCommands(entry: DbEntry): CopyCommand[] {
  const { dbEngine, dbHost, dbPort, dbName, dbUser } = entry;
  if (!dbHost) return [];
  const secret = secretRetrievalExpr(entry.secretProvider, entry.secretRef);
  const commands: CopyCommand[] = [];

  const connStr = buildConnectionString(entry);
  if (connStr) commands.push({ label: "Connection string", value: connStr });

  switch (dbEngine) {
    case "postgres": {
      const uri = `postgresql://${dbUser ? `${dbUser}@` : ""}${dbHost}${dbPort ? `:${dbPort}` : ""}${dbName ? `/${dbName}` : ""}`;
      const cmd = secret
        ? `PGPASSWORD="${secret}" psql "${uri}"`
        : `psql "${uri}"`;
      commands.push({ label: "psql", value: cmd });
      break;
    }
    case "mysql": {
      const parts = [
        "mysql",
        `-h ${dbHost}`,
        dbPort ? `-P ${dbPort}` : "",
        dbUser ? `-u ${dbUser}` : "",
        dbName ?? "",
      ].filter(Boolean);
      const base = parts.join(" ");
      const cmd = secret ? `MYSQL_PWD="${secret}" ${base}` : base;
      commands.push({ label: "mysql", value: cmd });
      break;
    }
    case "redis": {
      const parts = ["redis-cli", `-h ${dbHost}`, dbPort ? `-p ${dbPort}` : ""].filter(Boolean);
      const base = parts.join(" ");
      const cmd = secret ? `REDISCLI_AUTH="${secret}" ${base}` : base;
      commands.push({ label: "redis-cli", value: cmd });
      break;
    }
    case "mongodb": {
      const uri = `mongodb://${dbUser ? `${dbUser}@` : ""}${dbHost}${dbPort ? `:${dbPort}` : ""}${dbName ? `/${dbName}` : ""}`;
      commands.push({ label: "mongosh", value: `mongosh "${uri}"` });
      break;
    }
  }

  return commands;
}

/** SSH command for a host entry. */
export function buildSshCommand(entry: HostEntry): CopyCommand[] {
  const target = entry.hostname || entry.ipAddress;
  if (!target) return [];
  const parts = [
    "ssh",
    entry.sshPort ? `-p ${entry.sshPort}` : "",
    `${entry.sshUser ? `${entry.sshUser}@` : ""}${target}`,
  ].filter(Boolean);
  return [{ label: "ssh", value: parts.join(" ") }];
}
