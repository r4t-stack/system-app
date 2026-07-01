"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { checkEntryHealth } from "@/lib/actions/health";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HealthCheckButton({
  entryId,
  initialStatus,
  initialLatency,
}: {
  entryId: string;
  initialStatus: string | null;
  initialLatency: number | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [latency, setLatency] = useState(initialLatency);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const res = await checkEntryHealth(entryId);
    setPending(false);
    if (res.ok && res.data) {
      setStatus(res.data.status);
      setLatency(res.data.latencyMs);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status && (
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium",
            status === "UP"
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
          )}
        >
          {status}
          {latency != null ? ` · ${latency}ms` : ""}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={run} disabled={pending}>
        <Activity className="mr-1" />
        {pending ? "Checking…" : "Check health"}
      </Button>
    </div>
  );
}
