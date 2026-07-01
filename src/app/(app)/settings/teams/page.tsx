import { requireUser } from "@/lib/session";
import { getMyTeams } from "@/lib/data/shares";
import { TeamManager } from "@/components/team-manager";

export default async function TeamsPage() {
  const user = await requireUser();
  const teams = await getMyTeams(user);
  return <TeamManager teams={teams} currentUserId={user.id} />;
}
