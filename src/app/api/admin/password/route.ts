import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { auth } from "@/lib/auth";

/**
 * Changes the password of the signed-in admin account.
 *
 * Requires the current password (a stolen session should not be enough to lock
 * the real owner out), hashes with bcrypt, and throttles repeated wrong guesses.
 */
const MIN_LENGTH = 8;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstAt: number }>();

function isThrottled(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > ATTEMPT_WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(key: string): void {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > ATTEMPT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  } | null;

  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are both required." },
      { status: 400 }
    );
  }

  if (newPassword.length < MIN_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current one." },
      { status: 400 }
    );
  }

  const email = session.user.email?.trim().toLowerCase();
  const attemptKey = `password:${email ?? session.user.id}`;

  if (isThrottled(attemptKey)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const user = email
    ? await db.select().from(adminUsers).where(eq(adminUsers.email, email)).get()
    : undefined;

  if (!user) {
    return NextResponse.json(
      { error: "Admin account not found." },
      { status: 404 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    recordFailure(attemptKey);
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  failedAttempts.delete(attemptKey);

  const hashed = await bcrypt.hash(newPassword, 10);
  await db
    .update(adminUsers)
    .set({ password: hashed })
    .where(eq(adminUsers.id, user.id));

  return NextResponse.json({ ok: true });
}
