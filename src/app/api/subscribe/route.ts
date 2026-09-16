import { NextRequest, NextResponse } from "next/server";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lightweight per-IP throttle so a script can't fill the subscriber table
 * with thousands of fake addresses. In-memory (per serverless instance) —
 * enough to stop casual abuse without adding a database round-trip.
 */
const RATE_WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;
const recentSubmits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (recentSubmits.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= MAX_PER_WINDOW) {
    recentSubmits.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  recentSubmits.set(ip, timestamps);

  // Keep the map from growing without bound.
  if (recentSubmits.size > 5000) {
    recentSubmits.forEach((value, key) => {
      if (!value.some((t) => now - t < RATE_WINDOW_MS)) recentSubmits.delete(key);
    });
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

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
