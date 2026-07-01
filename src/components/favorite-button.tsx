"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  entryId,
  initial,
}: {
  entryId: string;
  initial: boolean;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onClick() {
    // Optimistic toggle.
    setFavorited((v) => !v);
    startTransition(async () => {
      const res = await toggleFavorite(entryId);
      if (res.ok && res.data) setFavorited(res.data.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove favorite" : "Add favorite"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
    >
      <Star
        className={cn(
          "h-4 w-4",
          favorited ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
