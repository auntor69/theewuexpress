import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      const post = await db
        .select()
        .from(posts)
        .where(sql`${posts.slug} = ${params.id} AND ${posts.published} = 1`)
        .get();

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json(post);
    }

    const session = await auth();
    const post = session
      ? await db.select().from(posts).where(eq(posts.id, id)).get()
      : await db.select().from(posts).where(sql`${posts.id} = ${id} AND ${posts.published} = 1`).get();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const slug = body.title ? slugify(body.title) || undefined : undefined;
    if (slug) {
      const existing = await db.select({ id: posts.id }).from(posts)
        .where(sql`${posts.slug} = ${slug} AND ${posts.id} != ${id}`).get();
      if (existing) {
        return NextResponse.json({ error: "A post with this title already exists" }, { status: 409 });
      }
    }

    const updatedPost = await db
      .update(posts)
      .set({
        title: body.title,
        slug,
        caption: body.caption,
        content: body.content,
        coverImage: body.coverImage,
        images: body.images ? JSON.stringify(body.images) : undefined,
        category: body.category,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        featured: body.featured,
        editorPick: body.editorPick,
        published: body.published,
        updatedAt: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
      })
      .where(eq(posts.id, id))
      .returning();

    if (!updatedPost.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    await db.delete(posts).where(eq(posts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
