import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { categories } from "@/lib/categories";
import { canonicalUrl } from "@/lib/siteUrl";
import { isoDate } from "@/lib/structuredData";

export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap: the static pages, one entry per category, and every
 * published story. Regenerated on request — stories appear here the moment
 * they are published, which is how Google finds them quickly.
 *
 * `/search` is deliberately absent: that page is noindex, and a sitemap entry
 * for a noindex URL is reported as an error in Search Console.
 *
 * Never throws: a database hiccup must not take down the sitemap, so crawlers
 * still get the static pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: canonicalUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: canonicalUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: canonicalUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const rows = await db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(5000);

    // The most recent edit in the paper. The front page and every section
    // front show exactly these stories, so this is their last-modified date —
    // the `datetime('now')` strings sort lexicographically as-is.
    const latestEdit = rows.reduce(
      (newest, row) => (row.updatedAt > newest ? row.updatedAt : newest),
      ""
    );
    const lastModified = isoDate(latestEdit);

    return [
      ...staticPages.map((page) =>
        lastModified ? { ...page, lastModified } : page
      ),
      ...categories.map((category) => ({
        url: canonicalUrl(`/category/${category.slug}`),
        changeFrequency: "hourly" as const,
        priority: 0.7,
        ...(lastModified ? { lastModified } : {}),
      })),
      ...rows.map((row) => ({
        url: canonicalUrl(`/article/${row.slug}`),
        lastModified: isoDate(row.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Crawler-facing endpoint: return the static pages rather than a 500.
    return staticPages;
  }
}
