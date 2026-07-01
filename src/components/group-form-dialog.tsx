"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup, updateGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GroupFormValues = {
  id?: string;
  name?: string;
  description?: string | null;
  color?: string | null;
};

export function GroupFormDialog({
  open,
  onOpenChange,
  parentId,
  group,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  group?: GroupFormValues;
}) {
  const router = useRouter();
  const editing = !!group?.id;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      color: String(form.get("color") ?? ""),
    };

    const res = editing
      ? await updateGroup({ id: group!.id!, ...payload })
      : await createGroup({ ...payload, parentId: parentId ?? null });

    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit group" : "New group"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              autoFocus
              defaultValue={group?.name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={group?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Colour</Label>
            <Input
              id="color"
              name="color"
              type="color"
              className="h-9 w-16 p-1"
              defaultValue={group?.color ?? "#4f46e5"}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
