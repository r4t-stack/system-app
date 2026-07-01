import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { requireUser } from "@/lib/session";
import { getEntry } from "@/lib/data/entries";
import { getFavoriteIds } from "@/lib/data/dashboard";
import { permissionMeets } from "@/lib/authz";
import { recordView } from "@/lib/actions/recents";
import { EntryActions } from "@/components/entry-actions";
import { FavoriteButton } from "@/components/favorite-button";
import { CopyButton } from "@/components/copy-button";
import {
  buildDbCommands,
  buildSshCommand,
  type CopyCommand,
} from "@/lib/connection-string";
import type { EditableEntry } from "@/components/entry-form-dialog";
import {
  ENTRY_TYPE_LABELS,
  ENVIRONMENT_BADGE,
  ENVIRONMENT_LABELS,
  type EntryType,
  type Environment,
  type SecretProvider,
} from "@/lib/constants";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-sm">{value}</dd>
    </div>
  );
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const user = await requireUser();
  const result = await getEntry(user, entryId);
  if (!result) notFound();

  const { entry, permission, tagNames } = result;
  await recordView(entry.id);
  const favoriteIds = await getFavoriteIds(user);
  const canWrite = permissionMeets(permission, "WRITE");
  const env = entry.environment as Environment;

  const commands: CopyCommand[] =
    entry.type === "DB_CONNECTION"
      ? buildDbCommands(entry)
      : entry.type === "HOST"
        ? buildSshCommand(entry)
        : entry.type === "LINK" && entry.url
          ? [{ label: "URL", value: entry.url }]
          : entry.type === "SERVICE" && entry.serviceUrl
            ? [{ label: "URL", value: entry.serviceUrl }]
            : [];

  const editable: EditableEntry = {
    id: entry.id,
    type: entry.type as EntryType,
    name: entry.name,
    description: entry.description,
    environment: env,
    url: entry.url,
    dbEngine: entry.dbEngine,
    dbHost: entry.dbHost,
    dbPort: entry.dbPort,
    dbName: entry.dbName,
    dbUser: entry.dbUser,
    secretProvider: entry.secretProvider as SecretProvider | null,
    secretRef: entry.secretRef,
    hostname: entry.hostname,
    ipAddress: entry.ipAddress,
    sshPort: entry.sshPort,
    sshUser: entry.sshUser,
    serviceUrl: entry.serviceUrl,
    healthCheckUrl: entry.healthCheckUrl,
    contentMd: entry.contentMd,
    tagNames,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href={`/groups/${entry.group.id}`} className="hover:underline">
          {entry.group.name}
        </Link>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {ENTRY_TYPE_LABELS[entry.type as EntryType]}
            </span>
            {env !== "NONE" && (
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${ENVIRONMENT_BADGE[env]}`}
              >
                {ENVIRONMENT_LABELS[env]}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{entry.name}</h1>
          {entry.description && (
            <p className="text-muted-foreground">{entry.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton entryId={entry.id} initial={favoriteIds.has(entry.id)} />
          {canWrite && (
            <EntryActions
              entry={editable}
              groupId={entry.group.id}
              redirectTo={`/groups/${entry.group.id}`}
            />
          )}
        </div>
      </div>

      {commands.length > 0 && (
        <div className="space-y-2 rounded-md border border-border p-4">
          {commands.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-sm text-muted-foreground">
                {c.label}
              </span>
              <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                {c.value}
              </code>
              <CopyButton value={c.value} />
            </div>
          ))}
        </div>
      )}

      <dl className="divide-y divide-border rounded-md border border-border px-4 py-2">
        <Row label="URL" value={entry.url} />
        <Row label="Engine" value={entry.dbEngine} />
        <Row label="Host" value={entry.dbHost} />
        <Row label="Port" value={entry.dbPort?.toString()} />
        <Row label="Database" value={entry.dbName} />
        <Row label="User" value={entry.dbUser} />
        <Row
          label="Secret"
          value={
            entry.secretProvider && entry.secretProvider !== "NONE"
              ? `${entry.secretProvider}: ${entry.secretRef ?? "—"}`
              : null
          }
        />
        <Row label="Hostname" value={entry.hostname} />
        <Row label="IP address" value={entry.ipAddress} />
        <Row label="SSH port" value={entry.sshPort?.toString()} />
        <Row label="SSH user" value={entry.sshUser} />
        <Row label="Service URL" value={entry.serviceUrl} />
        <Row label="Health-check" value={entry.healthCheckUrl} />
      </dl>

      {entry.type === "NOTE" && entry.contentMd && (
        <article className="prose prose-sm max-w-none rounded-md border border-border p-4 dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {entry.contentMd}
          </ReactMarkdown>
        </article>
      )}

      {tagNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tagNames.map((t) => (
            <Link
              key={t}
              href={`/tags/${encodeURIComponent(t)}`}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs hover:bg-accent"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
