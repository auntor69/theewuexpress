import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalPosts = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);

    const totalViews = await db
      .select({ total: sql<number>`sum(${posts.views})` })
      .from(posts);

    const topPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.views))
      .limit(10);

    const categoryStats = await db
      .select({
        category: posts.category,
        count: sql<number>`count(*)`,
        totalViews: sql<number>`sum(${posts.views})`,
      })
      .from(posts)
      .groupBy(posts.category);

    return NextResponse.json({
      totalPosts: totalPosts[0]?.count || 0,
      totalViews: totalViews[0]?.total || 0,
      topPosts,
      categoryStats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
