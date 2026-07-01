import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import {
  getGroupWithEntries,
  getGroupBreadcrumbs,
} from "@/lib/data/groups";
import { permissionMeets } from "@/lib/authz";
import { GroupActions } from "@/components/group-actions";
import { ENTRY_TYPE_LABELS, type EntryType } from "@/lib/constants";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await requireUser();
  const result = await getGroupWithEntries(user, groupId);
  if (!result) notFound();

  const { group, permission } = result;
  const breadcrumbs = await getGroupBreadcrumbs(groupId);
  const canWrite = permissionMeets(permission, "WRITE");
  const canAdmin = permissionMeets(permission, "ADMIN");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {b.id === group.id ? (
              <span className="text-foreground">{b.name}</span>
            ) : (
              <Link href={`/groups/${b.id}`} className="hover:underline">
                {b.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {group.color && (
            <span
              className="mt-1 h-5 w-5 shrink-0 rounded"
              style={{ backgroundColor: group.color }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-muted-foreground">{group.description}</p>
            )}
          </div>
        </div>
        <GroupActions
          group={{
            id: group.id,
            name: group.name,
            description: group.description,
            color: group.color,
          }}
          canWrite={canWrite}
          canAdmin={canAdmin}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Entries ({group.entries.length})
        </h2>
        {group.entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No entries in this group yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {group.entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 p-3">
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {ENTRY_TYPE_LABELS[entry.type as EntryType] ?? entry.type}
                </span>
                <Link
                  href={`/entries/${entry.id}`}
                  className="font-medium hover:underline"
                >
                  {entry.name}
                </Link>
                <span className="truncate text-sm text-muted-foreground">
                  {entry.url ??
                    entry.dbHost ??
                    entry.hostname ??
                    entry.serviceUrl ??
                    ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
