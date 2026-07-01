"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { importBookmarks, importJson } from "@/lib/actions/import";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupOption = { id: string; label: string };

async function fileText(input: HTMLInputElement): Promise<string | null> {
  const file = input.files?.[0];
  if (!file) return null;
  return file.text();
}

export function ImportExport({ groups }: { groups: GroupOption[] }) {
  const router = useRouter();
  const [bmGroup, setBmGroup] = useState(groups[0]?.id ?? "");
  const [jsonParent, setJsonParent] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onBookmarks(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const text = await fileText(input);
    if (!text || !bmGroup) return setMsg("Choose a file and a target group.");
    setPending(true);
    const res = await importBookmarks(bmGroup, text);
    setPending(false);
    setMsg(res.ok ? `Imported ${res.data?.count ?? 0} bookmarks.` : res.error);
    if (res.ok) router.refresh();
  }

  async function onJson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const text = await fileText(input);
    if (!text) return setMsg("Choose a JSON file.");
    setPending(true);
    const res = await importJson(jsonParent || null, text);
    setPending(false);
    setMsg(
      res.ok
        ? `Imported ${res.data?.groups ?? 0} groups and ${res.data?.entries ?? 0} entries.`
        : res.error,
    );
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-8">
      {msg && (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
          {msg}
        </p>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Export</h2>
        <p className="text-sm text-muted-foreground">
          Download everything you can access as JSON (includes secret references,
          never secret values).
        </p>
        <Button asChild variant="outline">
          <a href="/api/export" download>
            <Download className="mr-1" /> Download JSON
          </a>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Import browser bookmarks</h2>
        <form onSubmit={onBookmarks} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Target group</Label>
            <Select value={bmGroup} onValueChange={setBmGroup}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Choose group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input type="file" name="file" accept=".html,text/html" className="text-sm" />
          <div>
            <Button type="submit" disabled={pending}>
              Import bookmarks
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Import JSON</h2>
        <p className="text-sm text-muted-foreground">
          Recreates the exported group tree. Optionally nest it under an existing
          group.
        </p>
        <form onSubmit={onJson} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nest under (optional)</Label>
            <Select value={jsonParent || "root"} onValueChange={(v) => setJsonParent(v === "root" ? "" : v)}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Top level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Top level</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input type="file" name="file" accept=".json,application/json" className="text-sm" />
          <div>
            <Button type="submit" disabled={pending}>
              Import JSON
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
