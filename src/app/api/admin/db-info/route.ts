import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { databaseLabel, usingRemoteDatabase } from "@/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    databaseLabel,
    isRemote: usingRemoteDatabase,
  });
}
