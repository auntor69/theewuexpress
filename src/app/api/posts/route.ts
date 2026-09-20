import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, notInArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { slugify, escapeLikePattern } from "@/lib/utils";
import { getCategoryBySlug } from "@/lib/categories";
import { notifySubscribersOfPost, DISPATCH_BUDGET_MS } from "@/lib/newsletter";

/**
 * The newsletter send is awaited so serverless keeps the function alive while
 * it runs; the budget must therefore stay under this limit.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const editorPick = searchParams.get("editorPick");
  const trending = searchParams.get("trending");
  const search = searchParams.get("search");
  // Ids already displayed on the page (hero, most read, picks) so the feed
  // never repeats a story the reader has already scrolled past.
  const excludeIds = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((value) => parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 100);
  const offset = (page - 1) * limit;

  try {
    // "uncategorized" is a virtual filter: posts whose category has not been assigned yet.
    const uncategorized = category === "uncategorized";

    const conditions = [
      sql`${posts.published} = 1${uncategorized ? sql` AND ${posts.category} IS NULL` : sql``}`,
    ];

    if (category && !uncategorized) {
      conditions.push(sql`${posts.category} = ${category}`);
    }

    if (featured === "true") {
      conditions.push(sql`${posts.featured} = 1`);
    }

    if (editorPick === "true") {
      conditions.push(sql`${posts.editorPick} = 1`);
    }

    if (search) {
      const escaped = '%' + escapeLikePattern(search) + '%';
      conditions.push(sql`(${posts.title} LIKE ${escaped} ESCAPE '\\' OR ${posts.caption} LIKE ${escaped} ESCAPE '\\' OR ${posts.content} LIKE ${escaped} ESCAPE '\\')`);
    }

    if (excludeIds.length) {
      conditions.push(notInArray(posts.id, excludeIds));
    }

    const whereCondition = conditions.length === 1
      ? conditions[0]
      : sql.join(conditions, sql` AND `);

    const orderBy = trending === "true" ? desc(posts.views) : desc(posts.createdAt);

    const results = await db
      .select()
      .from(posts)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereCondition);

    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      posts: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Category is optional; if provided it must be a known slug (or legacy data to keep as-is).
    let category: string | null = null;
    if (body.category) {
      if (typeof body.category !== 'string') {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      if (!getCategoryBySlug(body.category)) {
        return NextResponse.json(
          { error: `Unknown category '${body.category}'` },
          { status: 400 }
        );
      }
      category = body.category;
    }

    let slug = slugify(body.title);

    if (!slug) {
      return NextResponse.json({ error: "Title must contain at least one alphanumeric character" }, { status: 400 });
    }

    const existing = await db.select({ id: posts.id }).from(posts)
      .where(sql`${posts.slug} = ${slug}`).get();
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const newPost = await db
      .insert(posts)
      .values({
        title: body.title,
        slug,
        caption: body.caption,
        content: body.content,
        coverImage: body.coverImage,
        images: JSON.stringify(body.images || []),
        category,
        tags: JSON.stringify(body.tags || []),
        featured: body.featured || false,
        editorPick: body.editorPick || false,
        published: body.published !== false,
      })
      .returning();

    // New post published → notify subscribers. Awaited (with an internal time
    // budget) so serverless keeps the function alive long enough to send;
    // anything that doesn't fit stays queued instead of being dropped, and
    // notifySubscribersOfPost never throws, so publishing can't fail on mail.
    if (newPost[0]?.published) {
      await notifySubscribersOfPost(newPost[0], { budgetMs: DISPATCH_BUDGET_MS });
    }

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
