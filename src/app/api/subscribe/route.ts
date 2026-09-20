import { NextRequest, NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/mailer";
import { startSubscription } from "@/lib/newsletter";

/** Sending the confirmation email needs a cold SMTP handshake to complete. */
export const maxDuration = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lightweight per-IP throttle so a script can't use this endpoint to fire
 * confirmation emails at thousands of addresses. In-memory (per serverless
 * instance) — enough to stop casual abuse without a database round-trip.
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

/**
 * Newsletter signup.
 *
 * This is double opt-in: the address is stored as *pending* and only starts
 * receiving stories after the reader clicks the link in the confirmation email
 * (see startSubscription). That link is our proof of consent, and it is what
 * prevents a stranger — or a typo — from being subscribed by someone else.
 */
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

    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 200 }
      );
    }

    const start = await startSubscription(email);

    if (start.status === "active") {
      return NextResponse.json({
        message: "You're already on the list — see you in your inbox!",
        alreadySubscribed: true,
      });
    }

    if (start.status === "failed") {
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // Pending: they only join the list once they confirm.
    const sent = await sendConfirmationEmail(start.email, start.confirmUrl);
    if (!sent.ok) {
      console.error("Confirmation email failed:", sent.error);
      return NextResponse.json(
        {
          error:
            "We couldn't send your confirmation email just now. Please try again in a moment.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: start.resent
        ? "Confirmation sent again — please check your inbox (and spam folder)."
        : "Almost there — check your inbox and click the confirmation link.",
      needsConfirmation: true,
      email: start.email,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
