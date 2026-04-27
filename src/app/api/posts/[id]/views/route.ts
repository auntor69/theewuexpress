import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const viewedPosts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_VIEWS_PER_WINDOW = 3;

function cleanupExpired() {
  const now = Date.now();
  for (const [key, timestamp] of viewedPosts) {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      viewedPosts.delete(key);
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const key = `${ip}:${id}`;

    cleanupExpired();

    const lastView = viewedPosts.get(key);
    if (lastView && Date.now() - lastView < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ success: true, cached: true });
    }

    const ipViewCount = Array.from(viewedPosts.keys()).filter(
      (k) => k.startsWith(`${ip}:`) && Date.now() - (viewedPosts.get(k) || 0) < RATE_LIMIT_WINDOW
    ).length;

    if (ipViewCount >= MAX_VIEWS_PER_WINDOW) {
      return NextResponse.json({ success: true, limited: true });
    }

    viewedPosts.set(key, Date.now());

    await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json(
      { error: "Failed to increment views" },
      { status: 500 }
    );
  }
}
