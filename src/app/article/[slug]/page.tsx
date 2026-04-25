import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleContent } from "@/components/article/ArticleContent";
import { RelatedPosts } from "@/components/article/RelatedPosts";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, params.slug))
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
    .where(eq(posts.slug, params.slug))
    .get();

  if (!post) notFound();

  const relatedPosts = await db
    .select()
    .from(posts)
    .where(
      sql`${posts.published} = 1 AND ${posts.id} != ${post.id} AND ${posts.category} = ${post.category}`
    )
    .orderBy(desc(posts.views))
    .limit(3);

  return (
    <main className="min-h-screen">
      <Navbar />
      <ArticleContent post={post} />
      <RelatedPosts posts={relatedPosts} />
      <Footer />
    </main>
  );
}
