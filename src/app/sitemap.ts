import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { categories } from "@/lib/categories";
import { resolveSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap: the static pages, one entry per category, and every
 * published story. Regenerated on request — stories appear here the moment
 * they are published, which is how Google finds them quickly.
 *
 * Never throws: a database hiccup must not take down the sitemap, so crawlers
 * still get the static pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const rows = await db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(5000);

    return [
      ...staticPages,
      ...categories.map((c) => ({
        url: `${base}/category/${c.slug}`,
        changeFrequency: "hourly" as const,
        priority: 0.7,
      })),
      ...rows.map((row) => ({
        url: `${base}/article/${row.slug}`,
        lastModified: row.updatedAt ? new Date(row.updatedAt.replace(" ", "T") + "Z") : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    // Crawler-facing endpoint: return the static pages rather than a 500.
    return staticPages;
  }
}
