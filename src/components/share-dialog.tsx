"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, X } from "lucide-react";
import { shareGroupWithUser, removeShare } from "@/lib/actions/shares";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PERMISSIONS, type Permission } from "@/lib/constants";

export type ShareRow = {
  id: string;
  permission: string;
  toUser: { email: string; name: string | null } | null;
  toTeam: { name: string } | null;
};

export function ShareDialog({
  groupId,
  shares,
}: {
  groupId: string;
  shares: ShareRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<Permission>("READ");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await shareGroupWithUser({ groupId, email, permission });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function remove(id: string) {
    await removeShare(id);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="mr-1" /> Share
        {shares.length > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({shares.length})
          </span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share group</DialogTitle>
            <DialogDescription>
              Access applies to this group and everything inside it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={add} className="space-y-3">
            {error && (
              <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="share-email">User email</Label>
                <Input
                  id="share-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                />
              </div>
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as Permission)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={pending}>
                Add
              </Button>
            </div>
          </form>

          <div className="space-y-1">
            {shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not shared with anyone yet.
              </p>
            ) : (
              shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {s.toUser
                      ? s.toUser.name
                        ? `${s.toUser.name} (${s.toUser.email})`
                        : s.toUser.email
                      : `Team: ${s.toTeam?.name}`}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.permission}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove share"
                    onClick={() => remove(s.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
