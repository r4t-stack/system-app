import { requireUser } from "@/lib/session";
import { getGroupTree } from "@/lib/data/groups";
import type { TreeNode } from "@/lib/tree";
import type { GroupTreeRow } from "@/lib/data/groups";
import { ImportExport } from "@/components/import-export";

function flatten(
  nodes: TreeNode<GroupTreeRow>[],
  depth = 0,
  acc: { id: string; label: string }[] = [],
) {
  for (const n of nodes) {
    acc.push({ id: n.id, label: `${"— ".repeat(depth)}${n.name}` });
    flatten(n.children as TreeNode<GroupTreeRow>[], depth + 1, acc);
  }
  return acc;
}

export default async function ImportExportPage() {
  const user = await requireUser();
  const tree = await getGroupTree(user);
  const groups = flatten(tree);
  return <ImportExport groups={groups} />;
}
