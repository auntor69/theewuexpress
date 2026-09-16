import { db } from "@/db";
import { posts } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleContent } from "@/components/article/ArticleContent";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { RelatedPosts } from "@/components/article/RelatedPosts";
import { sanitizeStoryHtml } from "@/lib/sanitizeContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await db
    .select()
    .from(posts)
    .where(sql`${posts.slug} = ${params.slug} AND ${posts.published} = 1`)
    .get();

  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} | The EWU Express`,
    description: post.caption,
    openGraph: {
      title: post.title,
      description: post.caption,
      images: [post.coverImage],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.caption,
      images: [post.coverImage],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const post = await db
    .select()
    .from(posts)
    .where(sql`${posts.slug} = ${params.slug} AND ${posts.published} = 1`)
    .get();

  if (!post) notFound();

  // Related posts: same category when possible, otherwise top editor picks.
  const relatedPosts = post.category
    ? await db
        .select()
        .from(posts)
        .where(
          sql`${posts.published} = 1 AND ${posts.id} != ${post.id} AND ${posts.category} = ${post.category}`
        )
        .orderBy(desc(posts.views))
        .limit(3)
    : await db
        .select()
        .from(posts)
        .where(sql`${posts.published} = 1 AND ${posts.id} != ${post.id}`)
        .orderBy(desc(posts.views))
        .limit(3);

  // Sanitized once, on the server, so the rendered HTML is clean for readers
  // and crawlers and the browser never has to load a sanitizer library.
  const safeContent = sanitizeStoryHtml(post.content);

  return (
    <main className="min-h-screen">
      <ReadingProgress />
      <Navbar />
      <ArticleContent post={post} safeContent={safeContent} />
      <RelatedPosts posts={relatedPosts} />
      <Footer />
    </main>
  );
}
