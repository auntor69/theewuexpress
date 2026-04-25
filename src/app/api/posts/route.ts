import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const editorPick = searchParams.get("editorPick");
  const trending = searchParams.get("trending");
  const search = searchParams.get("search");
  const offset = (page - 1) * limit;

  try {
    let whereCondition = sql`${posts.published} = 1`;

    if (category) {
      whereCondition = sql`${posts.published} = 1 AND ${posts.category} = ${category}`;
    }

    if (featured === "true") {
      whereCondition = sql`${posts.published} = 1 AND ${posts.featured} = 1`;
    }

    if (editorPick === "true") {
      whereCondition = sql`${posts.published} = 1 AND ${posts.editorPick} = 1`;
    }

    if (search) {
      whereCondition = sql`${posts.published} = 1 AND (${posts.title} LIKE ${'%' + search + '%'} OR ${posts.caption} LIKE ${'%' + search + '%'})`;
    }

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
    const slug = slugify(body.title);

    const newPost = await db
      .insert(posts)
      .values({
        title: body.title,
        slug,
        caption: body.caption,
        content: body.content,
        coverImage: body.coverImage,
        images: JSON.stringify(body.images || []),
        category: body.category,
        tags: JSON.stringify(body.tags || []),
        featured: body.featured || false,
        editorPick: body.editorPick || false,
        published: body.published !== false,
      })
      .returning();

    return NextResponse.json(newPost[0], { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
