import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <dl className="divide-y divide-border rounded-md border border-border px-4 py-2">
      <div className="grid grid-cols-[120px_1fr] gap-2 py-2">
        <dt className="text-sm text-muted-foreground">Email</dt>
        <dd className="text-sm">{user.email}</dd>
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-2 py-2">
        <dt className="text-sm text-muted-foreground">Role</dt>
        <dd className="text-sm">{user.role}</dd>
      </div>
    </dl>
  );
}
