import { NextResponse } from "next/server";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSubscribersTable();

    const [list, count] = await Promise.all([
      db.select().from(subscribers).orderBy(desc(subscribers.subscribedAt)).limit(500),
      db.select({ total: sql<number>`count(*)` }).from(subscribers),
    ]);

    return NextResponse.json({
      subscribers: list,
      total: Number(count[0]?.total ?? 0),
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}
