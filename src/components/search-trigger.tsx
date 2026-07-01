"use client";

import { Search } from "lucide-react";

export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
      className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
    >
      <Search className="h-4 w-4" />
      <span>Search…</span>
      <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
        ⌘K
      </kbd>
    </button>
  );
}
