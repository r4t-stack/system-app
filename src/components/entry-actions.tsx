"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteEntry } from "@/lib/actions/entries";
import { Button } from "@/components/ui/button";
import {
  EntryFormDialog,
  type EditableEntry,
} from "@/components/entry-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function EntryActions({
  entry,
  groupId,
  redirectTo,
}: {
  entry: EditableEntry;
  groupId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    const res = await deleteEntry(entry.id);
    setPending(false);
    if (res.ok) {
      setConfirmOpen(false);
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="mr-1" /> Edit
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
        <Trash2 className="mr-1" /> Delete
      </Button>

      <EntryFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        groupId={groupId}
        entry={entry}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{entry.name}”?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={onDelete}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
