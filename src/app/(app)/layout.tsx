import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getGroupTree } from "@/lib/data/groups";
import { GroupTree } from "@/components/group-tree";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { CommandPalette } from "@/components/command-palette";
import { SearchTrigger } from "@/components/search-trigger";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const tree = await getGroupTree(user);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/20">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/" className="font-semibold">
            DevOps Hub
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col py-2">
          <GroupTree tree={tree} />
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm">
          <span className="truncate text-muted-foreground" title={user.email}>
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
          <SearchTrigger />
          <ThemeToggle />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
