// Helpers for the materialized-path group tree.
//
// Convention: a group's `path` contains its own id and all ancestor ids,
// slash-delimited, with leading and trailing slashes, e.g. "/root/child/self/".
// This lets us find an entire subtree with `path LIKE '<groupPath>%'` and test
// ancestry with a simple string prefix — no recursive queries.

/** Build the path for a group given its parent's path (or null for a root). */
export function buildPath(parentPath: string | null, id: string): string {
  const base = parentPath ?? "/";
  return `${base}${id}/`;
}

/** Depth = number of ancestors (root = 0). */
export function depthFromPath(path: string): number {
  const ids = path.split("/").filter(Boolean);
  return Math.max(0, ids.length - 1);
}

/** Ordered list of ancestor ids for a group path (excludes the group itself). */
export function ancestorIds(path: string): string[] {
  const ids = path.split("/").filter(Boolean);
  return ids.slice(0, -1);
}

/** All ids on the path, including the group itself. */
export function pathIds(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** True if `ancestorPath` is an ancestor of (or equal to) `descendantPath`. */
export function isAncestorPath(
  ancestorPath: string,
  descendantPath: string,
): boolean {
  return descendantPath.startsWith(ancestorPath);
}

export type TreeNode<T> = T & { children: TreeNode<T>[] };

/** Assemble a flat list of `{ id, parentId }` rows into a nested tree. */
export function buildTree<T extends { id: string; parentId: string | null; sortOrder?: number }>(
  rows: T[],
): TreeNode<T>[] {
  const byId = new Map<string, TreeNode<T>>();
  for (const row of rows) byId.set(row.id, { ...row, children: [] });

  const roots: TreeNode<T>[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: TreeNode<T>[]) => {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const n of nodes) sort(n.children);
  };
  sort(roots);
  return roots;
}
