// Central catalog of the string "enums" used across the app. Because the dev
// database is SQLite (no native enums), these are the single source of truth,
// mirrored by the Zod schemas in src/lib/validation.

export const ENTRY_TYPES = [
  "LINK",
  "DB_CONNECTION",
  "HOST",
  "SERVICE",
  "NOTE",
] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  LINK: "Link",
  DB_CONNECTION: "Database",
  HOST: "Host / Server",
  SERVICE: "Service",
  NOTE: "Note",
};

export const ENVIRONMENTS = ["NONE", "DEV", "STAGING", "PROD"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  NONE: "—",
  DEV: "dev",
  STAGING: "staging",
  PROD: "prod",
};

// Tailwind classes for the environment badge (light + dark).
export const ENVIRONMENT_BADGE: Record<Environment, string> = {
  NONE: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  DEV: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  STAGING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PROD: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const SECRET_PROVIDERS = ["NONE", "VAULT", "ENV", "AWS_SM"] as const;
export type SecretProvider = (typeof SECRET_PROVIDERS)[number];

export const SECRET_PROVIDER_LABELS: Record<SecretProvider, string> = {
  NONE: "No secret",
  VAULT: "HashiCorp Vault",
  ENV: "Environment variable",
  AWS_SM: "AWS Secrets Manager",
};

export const PERMISSIONS = ["READ", "WRITE", "ADMIN"] as const;
export type Permission = (typeof PERMISSIONS)[number];

// Higher number = more capable. Used to pick the strongest permission match.
export const PERMISSION_RANK: Record<Permission, number> = {
  READ: 1,
  WRITE: 2,
  ADMIN: 3,
};

export const GLOBAL_ROLES = ["ADMIN", "MEMBER"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const TEAM_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const HEALTH_STATUSES = ["UP", "DOWN", "UNKNOWN"] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

// Common DB engines with their default ports (used by the connection-string builder).
export const DB_ENGINES = [
  { value: "postgres", label: "PostgreSQL", defaultPort: 5432 },
  { value: "mysql", label: "MySQL / MariaDB", defaultPort: 3306 },
  { value: "redis", label: "Redis", defaultPort: 6379 },
  { value: "mongodb", label: "MongoDB", defaultPort: 27017 },
  { value: "kafka", label: "Kafka", defaultPort: 9092 },
  { value: "clickhouse", label: "ClickHouse", defaultPort: 8123 },
  { value: "elasticsearch", label: "Elasticsearch", defaultPort: 9200 },
  { value: "cassandra", label: "Cassandra", defaultPort: 9042 },
  { value: "other", label: "Other", defaultPort: undefined },
] as const;
