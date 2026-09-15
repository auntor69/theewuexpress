import { NextRequest, NextResponse } from "next/server";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // First subscribe in a fresh environment auto-creates the table.
    await ensureSubscribersTable();

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 200 }
      );
    }

    const existing = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .get();

    if (existing) {
      return NextResponse.json({
        message: "You're already on the list — see you in your inbox!",
        alreadySubscribed: true,
      });
    }

    try {
      await db.insert(subscribers).values({ email });
    } catch {
      // Rare race: subscribed between check and insert. Still a success.
      return NextResponse.json({
        message: "You're already on the list — see you in your inbox!",
        alreadySubscribed: true,
      });
    }

    return NextResponse.json({
      message: "Subscribed! You'll get an email when we publish.",
      email,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
