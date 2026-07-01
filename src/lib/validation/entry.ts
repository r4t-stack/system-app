import { z } from "zod";
import {
  ENTRY_TYPES,
  ENVIRONMENTS,
  SECRET_PROVIDERS,
} from "@/lib/constants";

const optionalString = z.string().trim().max(2000).optional().or(z.literal(""));
const port = z.coerce.number().int().min(1).max(65535).optional();

/**
 * Heuristic guardrail: reject values that look like an actual secret being
 * pasted into the reference field. We only ever want a *pointer* (a Vault path,
 * an env-var name, an ARN) — never the credential itself.
 */
export function looksLikeRawSecret(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // user:password@host style
  if (/\/\/[^/\s]*:[^/@\s]+@/.test(v)) return true;
  if (/^[^\s:/@]+:[^\s:/@]{6,}@/.test(v)) return true;
  // long, high-entropy-looking token with no path/structure
  const looksStructured = v.includes("/") || v.includes("#") || v.startsWith("arn:");
  if (!looksStructured && v.length >= 24 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v)) {
    return true;
  }
  return false;
}

const secretRef = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || !looksLikeRawSecret(v), {
    message:
      "That looks like a real secret. Store only a reference (a Vault path, env var name, or ARN).",
  });

const base = {
  name: z.string().trim().min(1, "Name is required").max(160),
  description: optionalString,
  groupId: z.string().cuid(),
  environment: z.enum(ENVIRONMENTS).default("NONE"),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
};

const linkSchema = z.object({
  ...base,
  type: z.literal("LINK"),
  url: z.string().url("Enter a valid URL"),
});

const dbSchema = z.object({
  ...base,
  type: z.literal("DB_CONNECTION"),
  dbEngine: z.string().trim().min(1, "Engine is required").max(40),
  dbHost: z.string().trim().min(1, "Host is required").max(200),
  dbPort: port,
  dbName: optionalString,
  dbUser: optionalString,
  secretProvider: z.enum(SECRET_PROVIDERS).default("NONE"),
  secretRef,
});

const hostSchema = z.object({
  ...base,
  type: z.literal("HOST"),
  hostname: z.string().trim().min(1, "Hostname is required").max(200),
  ipAddress: optionalString,
  sshPort: port,
  sshUser: optionalString,
});

const serviceSchema = z.object({
  ...base,
  type: z.literal("SERVICE"),
  serviceUrl: z.string().url("Enter a valid URL"),
  healthCheckUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

const noteSchema = z.object({
  ...base,
  type: z.literal("NOTE"),
  contentMd: z.string().trim().max(20000).optional().or(z.literal("")),
});

export const entryCreateSchema = z.discriminatedUnion("type", [
  linkSchema,
  dbSchema,
  hostSchema,
  serviceSchema,
  noteSchema,
]);
export type EntryCreateInput = z.infer<typeof entryCreateSchema>;

// Update = create fields plus the id. Rebuild the union with id added.
export const entryUpdateSchema = z.discriminatedUnion("type", [
  linkSchema.extend({ id: z.string().cuid() }),
  dbSchema.extend({ id: z.string().cuid() }),
  hostSchema.extend({ id: z.string().cuid() }),
  serviceSchema.extend({ id: z.string().cuid() }),
  noteSchema.extend({ id: z.string().cuid() }),
]);
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>;

export const ENTRY_TYPE_VALUES = ENTRY_TYPES;
