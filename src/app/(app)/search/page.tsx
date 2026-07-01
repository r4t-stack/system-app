import { requireUser } from "@/lib/session";
import { searchEntries } from "@/lib/data/search";
import { getFavoriteIds } from "@/lib/data/dashboard";
import { EntryListItem } from "@/components/entry-list-item";
import { SearchFilters } from "@/components/search-filters";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const user = await requireUser();
  const filters = {
    q: one(sp.q),
    type: one(sp.type),
    environment: one(sp.env),
    tag: one(sp.tag),
    groupId: one(sp.group),
  };
  const hasQuery = Object.values(filters).some(Boolean);

  const [results, favoriteIds] = await Promise.all([
    hasQuery ? searchEntries(user, filters) : Promise.resolve([]),
    getFavoriteIds(user),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchFilters />
      {!hasQuery ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Enter a query or pick a filter.
        </p>
      ) : results.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No matching entries.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {results.map((entry) => (
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
