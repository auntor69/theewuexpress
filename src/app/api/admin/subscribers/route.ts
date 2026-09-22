import { NextRequest, NextResponse } from "next/server";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSubscribersTable();

    const [list, counts, expired] = await Promise.all([
      db
        .select()
        .from(subscribers)
        .orderBy(desc(subscribers.subscribedAt))
        .limit(500),
      db
        .select({
          total: sql<number>`count(*)`,
          // "Active" means they confirmed their address — only confirmed
          // readers are ever mailed (double opt-in).
          active: sql<number>`sum(case when ${subscribers.confirmedAt} is not null and ${subscribers.unsubscribedAt} is null then 1 else 0 end)`,
          awaiting: sql<number>`sum(case when ${subscribers.confirmedAt} is null and ${subscribers.unsubscribedAt} is null then 1 else 0 end)`,
          unsubscribed: sql<number>`sum(case when ${subscribers.unsubscribedAt} is null then 0 else 1 end)`,
        })
        .from(subscribers),
      // Pending signups whose confirmation link is past its advertised 7-day
      // window. They are never mailed either way — this count just lets the
      // admin see (and prune) the dead weight instead of it piling up forever.
      db
        .select({ total: sql<number>`count(*)` })
        .from(subscribers)
        .where(
          sql`${subscribers.confirmedAt} is null
            and ${subscribers.unsubscribedAt} is null
            and ${subscribers.subscribedAt} is not null
            and ${subscribers.subscribedAt} < datetime('now', '-7 days')`
        ),
    ]);

    return NextResponse.json({
      subscribers: list,
      total: Number(counts[0]?.total ?? 0),
      active: Number(counts[0]?.active ?? 0),
      awaiting: Number(counts[0]?.awaiting ?? 0),
      unsubscribed: Number(counts[0]?.unsubscribed ?? 0),
      expiredAwaiting: Number(expired[0]?.total ?? 0),
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

/** Removes an address entirely — used for bounces and unsubscribe requests. */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bulk prune of dead pending signups: never confirmed, never opted out, and
  // past the confirmation window, so the link can never be used. Removing them
  // is safe — the only thing lost is a row that could never become a reader.
  if (request.nextUrl.searchParams.get("pruneExpired") === "1") {
    try {
      await ensureSubscribersTable();
      const result = await db
        .delete(subscribers)
        .where(
          sql`${subscribers.confirmedAt} is null
            and ${subscribers.unsubscribedAt} is null
            and ${subscribers.subscribedAt} is not null
            and ${subscribers.subscribedAt} < datetime('now', '-7 days')`
        );
      return NextResponse.json({ ok: true, removed: result.rowsAffected });
    } catch (error) {
      console.error("Error pruning expired signups:", error);
      return NextResponse.json(
        { error: "Failed to prune expired signups" },
        { status: 500 }
      );
    }
  }

  const id = parseInt(request.nextUrl.searchParams.get("id") ?? "", 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "A valid id is required" }, { status: 400 });
  }

  try {
    await ensureSubscribersTable();
    await db.delete(subscribers).where(eq(subscribers.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
