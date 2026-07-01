import { requireUser } from "@/lib/session";
import { getAuditLog } from "@/lib/data/audit";

export default async function AuditPage() {
  const user = await requireUser();
  const logs = await getAuditLog(user);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {user.role === "ADMIN"
          ? "All recorded actions."
          : "Actions you performed or that touched groups you can access."}
      </p>
      {logs.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No activity yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border text-sm">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-16 shrink-0 rounded bg-muted px-2 py-0.5 text-center text-xs">
                {log.action}
              </span>
              <span className="text-muted-foreground">{log.entityType}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {log.actor.name ?? log.actor.email} ·{" "}
                {log.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
