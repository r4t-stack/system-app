"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, LayoutDashboard, Moon, Sun } from "lucide-react";
import type { EntrySummary } from "@/components/entry-list-item";
import { ENTRY_TYPE_LABELS, type EntryType } from "@/lib/constants";

export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntrySummary[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  // Debounced server search; Fuse re-ranks the returned set for typo tolerance.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { results: EntrySummary[] };
      if (query.trim()) {
        const fuse = new Fuse(data.results, {
          keys: ["name"],
          threshold: 0.4,
        });
        setResults(fuse.search(query).map((r) => r.item));
      } else {
        setResults(data.results);
      }
    }, 150);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      shouldFilter={false}
      className="fixed left-1/2 top-24 z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search entries, or run a command…"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
          No results.
        </Command.Empty>

        {results.length > 0 && (
          <Command.Group
            heading="Entries"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {results.map((entry) => (
              <Command.Item
                key={entry.id}
                value={`entry-${entry.id}`}
                onSelect={() => go(`/entries/${entry.id}`)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
              >
                <span className="w-20 shrink-0 truncate rounded bg-muted px-1.5 py-0.5 text-center text-xs text-muted-foreground">
                  {ENTRY_TYPE_LABELS[entry.type as EntryType] ?? entry.type}
                </span>
                <span className="truncate">{entry.name}</span>
                {entry.group && (
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {entry.group.name}
                  </span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group
          heading="Actions"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <Command.Item
            value="action-dashboard"
            onSelect={() => go("/")}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
          >
            <LayoutDashboard className="h-4 w-4" /> Go to dashboard
          </Command.Item>
          <Command.Item
            value="action-search-page"
            onSelect={() => go(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search")}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
          >
            <Search className="h-4 w-4" /> Open full search
          </Command.Item>
          <Command.Item
            value="action-theme"
            onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            Toggle theme
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
