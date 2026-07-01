"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  createTeam,
  addTeamMember,
  removeTeamMember,
} from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TeamData = {
  id: string;
  name: string;
  memberships: {
    userId: string;
    role: string;
    user: { id: string; email: string; name: string | null };
  }[];
};

export function TeamManager({
  teams,
  currentUserId,
}: {
  teams: TeamData[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await createTeam({ name });
    if (!res.ok) return setError(res.error);
    setName("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New team name"
            required
          />
        </div>
        <Button type="submit">Create team</Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not in any teams yet.
        </p>
      ) : (
        teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            currentUserId={currentUserId}
            onChange={() => router.refresh()}
          />
        ))
      )}
    </div>
  );
}

function TeamCard({
  team,
  currentUserId,
  onChange,
}: {
  team: TeamData;
  currentUserId: string;
  onChange: () => void;
}) {
  const [email, setEmail] = useState("");
  const myRole = team.memberships.find((m) => m.userId === currentUserId)?.role;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await addTeamMember(team.id, email);
    setEmail("");
    onChange();
  }

  async function remove(userId: string) {
    await removeTeamMember(team.id, userId);
    onChange();
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{team.name}</h3>
        <span className="text-xs text-muted-foreground">{myRole}</span>
      </div>
      <ul className="space-y-1">
        {team.memberships.map((m) => (
          <li
            key={m.userId}
            className="flex items-center justify-between text-sm"
          >
            <span>
              {m.user.name ?? m.user.email}
              <span className="ml-2 text-xs text-muted-foreground">{m.role}</span>
            </span>
            {(canManage || m.userId === currentUserId) &&
              !(m.role === "OWNER" && m.userId !== currentUserId) && (
                <button
                  type="button"
                  aria-label="Remove member"
                  onClick={() => remove(m.userId)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
          </li>
        ))}
      </ul>
      {canManage && (
        <form onSubmit={add} className="flex items-end gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Add member by email"
            required
          />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
