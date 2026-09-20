import { NextResponse } from "next/server";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

/** CSV export of the mailing list — the owner's copy, and proof of consent. */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSubscribersTable();
    const rows = await db
      .select()
      .from(subscribers)
      .orderBy(asc(subscribers.subscribedAt));

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [
      "email,status,subscribed_at,unsubscribed_at",
      ...rows.map((row) =>
        [
          escape(row.email ?? ""),
          row.unsubscribedAt ? "unsubscribed" : "active",
          escape(row.subscribedAt ?? ""),
          escape(row.unsubscribedAt ?? ""),
        ].join(",")
      ),
    ].join("\n");

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ewu-express-subscribers-${stamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting subscribers:", error);
    return NextResponse.json(
      { error: "Failed to export subscribers" },
      { status: 500 }
    );
  }
}
