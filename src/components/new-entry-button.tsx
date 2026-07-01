"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryFormDialog } from "@/components/entry-form-dialog";

export function NewEntryButton({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1" /> New entry
      </Button>
      <EntryFormDialog open={open} onOpenChange={setOpen} groupId={groupId} />
    </>
  );
}
