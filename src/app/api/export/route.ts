import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { buildExport } from "@/lib/data/export";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await buildExport(user);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="devops-hub-export.json"`,
    },
  });
}
