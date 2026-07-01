import { Star, Clock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getFavorites, getRecents, getFavoriteIds } from "@/lib/data/dashboard";
import { EntryListItem, type EntrySummary } from "@/components/entry-list-item";

function Section({
  title,
  icon,
  entries,
  favoriteIds,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  entries: EntrySummary[];
  favoriteIds: Set<string>;
  empty: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {empty}
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
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [favorites, recents, favoriteIds] = await Promise.all([
    getFavorites(user),
    getRecents(user),
    getFavoriteIds(user),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your starred and recently opened entries.</p>
      </div>
      <Section
        title="Favorites"
        icon={<Star className="h-4 w-4" />}
        entries={favorites}
        favoriteIds={favoriteIds}
        empty="Star an entry to pin it here."
      />
      <Section
        title="Recently opened"
        icon={<Clock className="h-4 w-4" />}
        entries={recents}
        favoriteIds={favoriteIds}
        empty="Entries you open will show up here."
      />
    </div>
  );
}
