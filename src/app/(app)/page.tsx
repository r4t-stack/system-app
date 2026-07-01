import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Signed in as {user.email}. Pick a group from the sidebar or create a
          new one.
        </p>
      </div>
    </div>
  );
}
