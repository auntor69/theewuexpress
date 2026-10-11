import { db } from "@/db";
import { posts } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { articleUrl, canonicalUrl, pageAlternates, resolveSiteUrl } from "@/lib/siteUrl";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleContent } from "@/components/article/ArticleContent";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { RelatedPosts } from "@/components/article/RelatedPosts";
import { sanitizeStoryHtml } from "@/lib/sanitizeContent";
import { getCategoryBySlug } from "@/lib/categories";
import {
  PUBLISHER_NAME,
  breadcrumbNode,
  isoDate,
  jsonLdGraph,
  newsArticleNode,
  organizationNode,
  parseTags,
  serializeJsonLd,
} from "@/lib/structuredData";
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

  // An unpublished or mistyped slug is a dead end: keep it out of the index
  // instead of letting a thin "not found" page be crawled.
  if (!post) {
    return { title: "Story not found", robots: { index: false, follow: true } };
  }

  const path = `/article/${post.slug}`;
  const url = canonicalUrl(path);
  const published = isoDate(post.createdAt);
  const modified = isoDate(post.updatedAt);
  const category = getCategoryBySlug(post.category);
  const tags = parseTags(post.tags);

  return {
    // Bare headline: the root layout's template adds "| The EWU Express" once.
    title: post.title,
    description: post.caption,
    alternates: pageAlternates(path),
    keywords: tags,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.caption,
      url,
      siteName: PUBLISHER_NAME,
      locale: "en_US",
      images: [{ url: post.coverImage, alt: post.title }],
      ...(published ? { publishedTime: published } : {}),
      ...(modified ? { modifiedTime: modified } : {}),
      ...(category ? { section: category.name } : {}),
      ...(tags.length ? { tags } : {}),
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

  const category = getCategoryBySlug(post.category);
  const storyUrl = canonicalUrl(`/article/${post.slug}`);
  const site = { url: resolveSiteUrl(), logo: `${resolveSiteUrl()}/logo.png` };

  // Google News / Discover rich results read this structured data — the
  // publication, the story, and the same trail the reader sees on the page.
  const jsonLd = jsonLdGraph([
    organizationNode(site),
    newsArticleNode(post, site, category?.name),
    breadcrumbNode([
      { name: PUBLISHER_NAME, url: `${site.url}/` },
      ...(category
        ? [{ name: category.name, url: `${site.url}/category/${category.slug}` }]
        : []),
      { name: post.title, url: storyUrl },
    ]),
  ]);

  // Absolute URL for the share links. The request host is the most accurate
  // origin (preview deployments included); settings/env resolve the fallback.
  const requestHeaders = headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const shareUrl = host
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
        // serializeJsonLd escapes `<`, `>` and `&`, so a headline containing
        // `</script>` cannot close this tag.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ReadingProgress />
      <Navbar />
      <ArticleContent
        post={post}
        safeContent={safeContent}
        canonicalUrl={shareUrl}
      />
      <RelatedPosts posts={relatedPosts} />
      <Footer />
    </main>
  );
}
