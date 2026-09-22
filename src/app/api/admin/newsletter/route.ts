import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  drainNewsletterQueue,
  getNewsletterOverview,
  RESUME_BUDGET_MS,
} from "@/lib/newsletter";

/** Resuming a send can take a while — allow the function to finish it. */
export const maxDuration = 60;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getNewsletterOverview());
  } catch (error) {
    console.error("Error reading newsletter status:", error);
    return NextResponse.json(
      { error: "Failed to read newsletter status" },
      { status: 500 }
    );
  }
}

/**
 * Sends whatever is still pending. Used by the admin "send remaining" button
 * after a large list could not be completed inside the publish request.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const postId =
      typeof body?.postId === "number" && Number.isInteger(body.postId)
        ? body.postId
        : undefined;

    const summary = await drainNewsletterQueue({
      postId,
      retryFailed: body?.retryFailed === true,
      budgetMs: RESUME_BUDGET_MS,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("Error resuming newsletter:", error);
    return NextResponse.json(
      { error: "Failed to send the remaining emails" },
      { status: 500 }
    );
  }
}
