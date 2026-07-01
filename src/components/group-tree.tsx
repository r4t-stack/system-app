"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronRight, Folder, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/tree";
import type { GroupTreeRow } from "@/lib/data/groups";
import { GroupFormDialog } from "@/components/group-form-dialog";
import { moveGroup } from "@/lib/actions/groups";
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

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } =
    useDraggable({ id: node.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${node.id}` });

  return (
    <li>
      <div
        ref={setDropRef}
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 text-sm",
          active ? "bg-accent" : "hover:bg-accent/60",
          isOver && "ring-2 ring-primary",
          isDragging && "opacity-40",
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
        <button
          type="button"
          ref={setDragRef}
          aria-label="Drag to move"
          className="hidden h-6 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground group-hover:flex"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
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

function findName(nodes: Node[], id: string): string | null {
  for (const n of nodes) {
    if (n.id === id) return n.name;
    const found = findName(n.children as Node[], id);
    if (found) return found;
  }
  return null;
}

export function GroupTree({ tree }: { tree: Node[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = pathname.startsWith("/groups/") ? pathname.split("/")[2] : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const { setNodeRef: setRootRef, isOver: overRoot } = useDroppable({ id: "root" });

  function openNew(parent: string | null) {
    setParentId(parent);
    setDialogOpen(true);
  }

  async function onDragEnd(e: DragEndEvent) {
    setDragId(null);
    const activeGroupId = String(e.active.id);
    const over = e.over?.id ? String(e.over.id) : null;
    if (!over) return;

    const targetParentId = over === "root" ? null : over.replace(/^drop-/, "");
    if (targetParentId === activeGroupId) return; // dropped on itself

    await moveGroup({ id: activeGroupId, parentId: targetParentId });
    router.refresh();
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragId(null)}
    >
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
          {/* Drop here to move a group to the top level. */}
          <div
            ref={setRootRef}
            className={cn(
              "mt-1 rounded-md border border-dashed border-transparent px-3 py-2 text-xs text-muted-foreground",
              dragId && "border-border",
              overRoot && "ring-2 ring-primary",
            )}
          >
            {dragId ? "Drop here for top level" : ""}
          </div>
        </nav>
        <GroupFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          parentId={parentId}
        />
      </div>
      <DragOverlay>
        {dragId ? (
          <div className="rounded-md border border-border bg-popover px-2 py-1 text-sm shadow">
            {findName(tree, dragId) ?? "Group"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
