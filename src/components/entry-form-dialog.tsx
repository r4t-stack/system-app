"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntry, updateEntry } from "@/lib/actions/entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
  SECRET_PROVIDERS,
  SECRET_PROVIDER_LABELS,
  DB_ENGINES,
  type EntryType,
  type Environment,
  type SecretProvider,
} from "@/lib/constants";

// Shape accepted for editing — a plain serializable entry.
export type EditableEntry = {
  id: string;
  type: EntryType;
  name: string;
  description?: string | null;
  environment: Environment;
  url?: string | null;
  dbEngine?: string | null;
  dbHost?: string | null;
  dbPort?: number | null;
  dbName?: string | null;
  dbUser?: string | null;
  secretProvider?: SecretProvider | null;
  secretRef?: string | null;
  hostname?: string | null;
  ipAddress?: string | null;
  sshPort?: number | null;
  sshUser?: string | null;
  serviceUrl?: string | null;
  healthCheckUrl?: string | null;
  contentMd?: string | null;
  tagNames?: string[];
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function EntryFormDialog({
  open,
  onOpenChange,
  groupId,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  entry?: EditableEntry;
}) {
  const router = useRouter();
  const editing = !!entry;
  const [type, setType] = useState<EntryType>(entry?.type ?? "LINK");
  const [environment, setEnvironment] = useState<Environment>(
    entry?.environment ?? "NONE",
  );
  const [dbEngine, setDbEngine] = useState(entry?.dbEngine ?? "postgres");
  const [secretProvider, setSecretProvider] = useState<SecretProvider>(
    (entry?.secretProvider as SecretProvider) ?? "NONE",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);
    const form = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = form.get(k);
      return v == null ? undefined : String(v);
    };
    const tagNames = (str("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const common = {
      type,
      name: str("name") ?? "",
      description: str("description") ?? "",
      environment,
      tagNames,
      groupId: editing ? undefined : groupId,
    };

    let payload: Record<string, unknown> = { ...common };
    if (type === "LINK") payload.url = str("url");
    if (type === "DB_CONNECTION") {
      payload = {
        ...payload,
        dbEngine,
        dbHost: str("dbHost"),
        dbPort: str("dbPort") || undefined,
        dbName: str("dbName"),
        dbUser: str("dbUser"),
        secretProvider,
        secretRef: str("secretRef"),
      };
    }
    if (type === "HOST") {
      payload = {
        ...payload,
        hostname: str("hostname"),
        ipAddress: str("ipAddress"),
        sshPort: str("sshPort") || undefined,
        sshUser: str("sshUser"),
      };
    }
    if (type === "SERVICE") {
      payload = {
        ...payload,
        serviceUrl: str("serviceUrl"),
        healthCheckUrl: str("healthCheckUrl"),
      };
    }
    if (type === "NOTE") payload.contentMd = str("contentMd");

    const res = editing
      ? await updateEntry({ ...payload, id: entry!.id, groupId: groupId })
      : await createEntry(payload);

    setPending(false);
    if (!res.ok) {
      setError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit entry" : "New entry"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {!editing && (
            <Field label="Type">
              <Select value={type} onValueChange={(v) => setType(v as EntryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ENTRY_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input name="name" required autoFocus defaultValue={entry?.name ?? ""} />
            </Field>
            <Field label="Environment">
              <Select
                value={environment}
                onValueChange={(v) => setEnvironment(v as Environment)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((env) => (
                    <SelectItem key={env} value={env}>
                      {ENVIRONMENT_LABELS[env]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {type === "LINK" && (
            <Field label="URL">
              <Input name="url" placeholder="https://…" defaultValue={entry?.url ?? ""} />
            </Field>
          )}

          {type === "DB_CONNECTION" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Engine">
                  <Select value={dbEngine} onValueChange={setDbEngine}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DB_ENGINES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Port">
                  <Input name="dbPort" type="number" defaultValue={entry?.dbPort ?? ""} />
                </Field>
              </div>
              <Field label="Host">
                <Input name="dbHost" placeholder="db.prod.internal" defaultValue={entry?.dbHost ?? ""} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Database">
                  <Input name="dbName" defaultValue={entry?.dbName ?? ""} />
                </Field>
                <Field label="User">
                  <Input name="dbUser" defaultValue={entry?.dbUser ?? ""} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Secret provider">
                  <Select
                    value={secretProvider}
                    onValueChange={(v) => setSecretProvider(v as SecretProvider)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECRET_PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {SECRET_PROVIDER_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Secret reference">
                  <Input
                    name="secretRef"
                    placeholder="secret/data/prod/db#password"
                    defaultValue={entry?.secretRef ?? ""}
                  />
                </Field>
              </div>
              {fieldErrors.secretRef && (
                <p className="text-sm text-red-600">{fieldErrors.secretRef[0]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Store only a <strong>reference</strong> to the secret — never the
                password itself.
              </p>
            </div>
          )}

          {type === "HOST" && (
            <div className="space-y-3">
              <Field label="Hostname">
                <Input name="hostname" placeholder="bastion.internal" defaultValue={entry?.hostname ?? ""} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="IP address">
                  <Input name="ipAddress" defaultValue={entry?.ipAddress ?? ""} />
                </Field>
                <Field label="SSH port">
                  <Input name="sshPort" type="number" defaultValue={entry?.sshPort ?? ""} />
                </Field>
                <Field label="SSH user">
                  <Input name="sshUser" defaultValue={entry?.sshUser ?? ""} />
                </Field>
              </div>
            </div>
          )}

          {type === "SERVICE" && (
            <div className="space-y-3">
              <Field label="Service URL">
                <Input name="serviceUrl" placeholder="https://api.internal/svc" defaultValue={entry?.serviceUrl ?? ""} />
              </Field>
              <Field label="Health-check URL">
                <Input name="healthCheckUrl" placeholder="https://api.internal/svc/health" defaultValue={entry?.healthCheckUrl ?? ""} />
              </Field>
            </div>
          )}

          {type === "NOTE" && (
            <Field label="Content (Markdown)">
              <Textarea name="contentMd" rows={8} defaultValue={entry?.contentMd ?? ""} />
            </Field>
          )}

          <Field label="Description">
            <Textarea name="description" defaultValue={entry?.description ?? ""} />
          </Field>

          <Field label="Tags (comma separated)">
            <Input
              name="tags"
              placeholder="monitoring, prod"
              defaultValue={(entry?.tagNames ?? []).join(", ")}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
