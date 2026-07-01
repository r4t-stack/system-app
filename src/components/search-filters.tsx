"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
} from "@/lib/constants";

const ANY = "__any__";

export function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ANY) next.delete(key);
    else next.set(key, value);
    router.replace(`/search?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        defaultValue={params.get("q") ?? ""}
        placeholder="Search…"
        autoFocus
        className="max-w-xs"
        onChange={(e) => setParam("q", e.target.value)}
      />
      <Select
        value={params.get("type") ?? ANY}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Any type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any type</SelectItem>
          {ENTRY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {ENTRY_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("env") ?? ANY}
        onValueChange={(v) => setParam("env", v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Any environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any environment</SelectItem>
          {ENVIRONMENTS.filter((e) => e !== "NONE").map((e) => (
            <SelectItem key={e} value={e}>
              {ENVIRONMENT_LABELS[e]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
