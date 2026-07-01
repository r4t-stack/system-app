// Build the denormalized `searchText` for an entry: everything a user might
// type to find it, lower-cased and space-joined.
type EntryLike = {
  name: string;
  description?: string | null;
  url?: string | null;
  dbEngine?: string | null;
  dbHost?: string | null;
  dbName?: string | null;
  hostname?: string | null;
  ipAddress?: string | null;
  serviceUrl?: string | null;
  healthCheckUrl?: string | null;
  contentMd?: string | null;
};

export function buildSearchText(entry: EntryLike, tagNames: string[]): string {
  return [
    entry.name,
    entry.description,
    entry.url,
    entry.dbEngine,
    entry.dbHost,
    entry.dbName,
    entry.hostname,
    entry.ipAddress,
    entry.serviceUrl,
    entry.healthCheckUrl,
    entry.contentMd,
    ...tagNames,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
