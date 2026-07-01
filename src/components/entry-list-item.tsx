"use client";

import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { FavoriteButton } from "@/components/favorite-button";
import {
  ENTRY_TYPE_LABELS,
  ENVIRONMENT_BADGE,
  ENVIRONMENT_LABELS,
  type EntryType,
  type Environment,
} from "@/lib/constants";

export type EntrySummary = {
  id: string;
  name: string;
  type: string;
  environment: string;
  url?: string | null;
  dbHost?: string | null;
  hostname?: string | null;
  serviceUrl?: string | null;
  group?: { id: string; name: string } | null;
};

function primaryValue(entry: EntrySummary): string | null {
  return entry.url ?? entry.serviceUrl ?? entry.dbHost ?? entry.hostname ?? null;
}

export function EntryListItem({
  entry,
  favorited,
  showGroup = false,
}: {
  entry: EntrySummary;
  favorited: boolean;
  showGroup?: boolean;
}) {
  const value = primaryValue(entry);
  const env = entry.environment as Environment;

  return (
    <li className="flex items-center gap-3 p-3">
      <span className="w-20 shrink-0 truncate rounded bg-muted px-2 py-0.5 text-center text-xs text-muted-foreground">
        {ENTRY_TYPE_LABELS[entry.type as EntryType] ?? entry.type}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/entries/${entry.id}`} className="font-medium hover:underline">
            {entry.name}
          </Link>
          {env !== "NONE" && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ENVIRONMENT_BADGE[env]}`}>
              {ENVIRONMENT_LABELS[env]}
            </span>
          )}
        </div>
        {value && (
          <div className="truncate font-mono text-xs text-muted-foreground">{value}</div>
        )}
        {showGroup && entry.group && (
          <Link
            href={`/groups/${entry.group.id}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            {entry.group.name}
          </Link>
        )}
      </div>
      {value && <CopyButton value={value} />}
      <FavoriteButton entryId={entry.id} initial={favorited} />
    </li>
  );
}
