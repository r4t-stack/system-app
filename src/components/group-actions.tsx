"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { GroupFormDialog } from "@/components/group-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function GroupActions({
  group,
  canWrite,
  canAdmin,
}: {
  group: { id: string; name: string; description: string | null; color: string | null };
  canWrite: boolean;
  canAdmin: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    const res = await deleteGroup(group.id);
    setPending(false);
    if (res.ok) {
      setConfirmOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  if (!canWrite && !canAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      {canWrite && (
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1" /> Edit
        </Button>
      )}
      {canAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="mr-1" /> Delete
        </Button>
      )}

      <GroupFormDialog open={editOpen} onOpenChange={setEditOpen} group={group} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{group.name}”?</DialogTitle>
            <DialogDescription>
              This permanently deletes the group, its subgroups and all their
              entries. This cannot be undone.
            </DialogDescription>
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
