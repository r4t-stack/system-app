"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Folder, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/tree";
import type { GroupTreeRow } from "@/lib/data/groups";
import { GroupFormDialog } from "@/components/group-form-dialog";
import { Button } from "@/components/ui/button";

type Node = TreeNode<GroupTreeRow>;

function TreeItem({
  node,
  depth,
  activeId,
  onAddChild,
}: {
  node: Node;
  depth: number;
  activeId: string | null;
  onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const active = node.id === activeId;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 text-sm",
          active ? "bg-accent" : "hover:bg-accent/60",
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        <button
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex h-6 w-5 shrink-0 items-center justify-center text-muted-foreground",
            !hasChildren && "invisible",
          )}
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
          />
        </button>
        <Link
          href={`/groups/${node.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5"
        >
          {node.color ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: node.color }}
            />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
          {node.entryCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {node.entryCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          aria-label="Add subgroup"
          onClick={() => onAddChild(node.id)}
          className="hidden h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent group-hover:flex"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child as Node}
              depth={depth + 1}
              activeId={activeId}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function GroupTree({ tree }: { tree: Node[] }) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/groups/")
    ? pathname.split("/")[2]
    : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  function openNew(parent: string | null) {
    setParentId(parent);
    setDialogOpen(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Groups
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="New group"
          onClick={() => openNew(null)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-1">
        {tree.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No groups yet. Create one to get started.
          </p>
        ) : (
          <ul>
            {tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                activeId={activeId}
                onAddChild={openNew}
              />
            ))}
          </ul>
        )}
      </nav>
      <GroupFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentId={parentId}
      />
    </div>
  );
}
