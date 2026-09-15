import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { slugify, escapeLikePattern } from "@/lib/utils";
import { getCategoryBySlug } from "@/lib/categories";
import { notifySubscribersOfPost } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const editorPick = searchParams.get("editorPick");
  const trending = searchParams.get("trending");
  const search = searchParams.get("search");
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

    // New post published → notify subscribers (best-effort, never blocks the response).
    if (newPost[0]?.published) {
      void notifySubscribersOfPost(newPost[0]);
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
