import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCategoryBySlug } from "@/lib/categories";
import { resolveSiteUrl } from "@/lib/siteUrl";
import { stripHtml, escapeXml, toRfc822 } from "@/lib/feed";

export const dynamic = "force-dynamic";

/**
 * RSS 2.0 feed of the latest published stories.
 *
 * A student publication is shared through reader apps (Feedly, Feedme, WhatsApp
 * channel tools) and university mailing lists; this is what they subscribe to.
 * Hand-rolled XML rather than a library: the shape is small and fixed, and the
 * escaping/strip helpers are unit-tested in lib/feed.
 *
 * Never throws: a database hiccup must not take the feed down, so the last
 * response is an empty channel rather than a 500.
 */
/** Best-effort MIME type for an enclosure, from the image URL's extension. */
function imageMime(url: string): string {
  if (/\.png(\?|$)/i.test(url)) return "image/png";
  if (/\.webp(\?|$)/i.test(url)) return "image/webp";
  if (/\.gif(\?|$)/i.test(url)) return "image/gif";
  if (/\.avif(\?|$)/i.test(url)) return "image/avif";
  return "image/jpeg";
}

export async function GET() {
  const base = resolveSiteUrl();
  const siteUrl = `${base}/`;
  const feedUrl = `${base}/rss`;

  let itemsXml = "";
  let lastBuildDate: string | undefined;

  try {
    const rows = await db
      .select({
        title: posts.title,
        slug: posts.slug,
        caption: posts.caption,
        content: posts.content,
        coverImage: posts.coverImage,
        category: posts.category,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(30);

    lastBuildDate = rows[0]?.createdAt ? toRfc822(rows[0].createdAt) : undefined;

    itemsXml = rows
      .map((row) => {
        const url = `${base}/article/${row.slug}`;
        const description = stripHtml(row.caption || row.content).slice(0, 500);
        const categoryName = getCategoryBySlug(row.category)?.name;
        const pubDate = toRfc822(row.createdAt);

        return `    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>${
        pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""
      }
      <description>${escapeXml(description)}</description>${
        categoryName ? `\n      <category>${escapeXml(categoryName)}</category>` : ""
      }${
        row.coverImage
          ? `\n      <enclosure url="${escapeXml(row.coverImage)}" type="${imageMime(row.coverImage)}" />`
          : ""
      }
    </item>`;
      })
      .join("\n");
  } catch (error) {
    console.error("RSS feed generation failed:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The EWU Express</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(
      "The student news publication of East West University. Campus heat, real stories, student voice — reported with care."
    )}</description>
    <language>en</language>${
      lastBuildDate ? `\n    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : ""
    }
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${
      itemsXml ? `\n${itemsXml}` : ""
    }
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Long cache: the feed is read by polling apps, and the DB read is cheap.
      "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
