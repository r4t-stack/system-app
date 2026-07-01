import { requireUser } from "@/lib/session";
import { getEntriesByTag } from "@/lib/data/tags";
import { getFavoriteIds } from "@/lib/data/dashboard";
import { EntryListItem } from "@/components/entry-list-item";

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const tagName = decodeURIComponent(tag);
  const user = await requireUser();
  const [entries, favoriteIds] = await Promise.all([
    getEntriesByTag(user, tagName),
    getFavoriteIds(user),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">#{tagName}</h1>
      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No accessible entries with this tag.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {entries.map((entry) => (
            <EntryListItem
              key={entry.id}
              entry={entry}
              favorited={favoriteIds.has(entry.id)}
              showGroup
            />
          ))}
        </ul>
      )}
    </div>
  );
}
