import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { searchEntries } from "@/lib/data/search";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const results = await searchEntries(user, {
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    environment: searchParams.get("env") ?? undefined,
    groupId: searchParams.get("group") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
  });

  return NextResponse.json({ results });
}
