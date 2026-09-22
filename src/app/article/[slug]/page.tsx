import { db } from "@/db";
import { posts } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { articleUrl, resolveSiteUrl } from "@/lib/siteUrl";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleContent } from "@/components/article/ArticleContent";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { RelatedPosts } from "@/components/article/RelatedPosts";
import { sanitizeStoryHtml } from "@/lib/sanitizeContent";
import { parseUTCDate } from "@/lib/utils";
import { getCategoryBySlug } from "@/lib/categories";
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

  // Google News / Discover rich results read this structured data. Only real
  // datetimes go in: a placeholder would be worse than none.
  const publishedIso = parseUTCDate(post.createdAt).toISOString();
  const modifiedIso = parseUTCDate(post.updatedAt).toISOString();
  const categoryName = getCategoryBySlug(post.category)?.name;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.caption,
    image: [post.coverImage],
    datePublished: publishedIso,
    dateModified: modifiedIso,
    ...(categoryName ? { articleSection: categoryName } : {}),
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "The EWU Express",
      logo: { "@type": "ImageObject", url: `${resolveSiteUrl()}/logo.png` },
    },
  };

  // Absolute URL for the share links. The request host is the most accurate
  // origin (preview deployments included); settings/env resolve the fallback.
  const requestHeaders = headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const canonicalUrl = host
    ? `${protocol}://${host}/article/${post.slug}`
    : articleUrl(post);

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
      <script
        type="application/ld+json"
        // JSON.stringify output is safe inside a script tag here: the content
        // comes from the database (escaped on write) and contains no `</script`
        // sequences, which is the one string that could break out.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <Navbar />
      <ArticleContent
        post={post}
        safeContent={safeContent}
        canonicalUrl={canonicalUrl}
      />
      <RelatedPosts posts={relatedPosts} />
      <Footer />
    </main>
  );
}
