import { parseUTCDate } from "./utils";

/**
 * schema.org structured data, built as plain objects.
 *
 * Every builder is pure — no database, no framework imports — so the shapes
 * that search engines consume can be unit-tested directly (same split as
 * `lib/feed.ts` and `lib/categories.ts`). Pages compose the nodes into a
 * single `@graph` document and render it through `serializeJsonLd`.
 */

export const PUBLISHER_NAME = "The EWU Express";
export const PUBLISHER_ALTERNATE_NAME = "EWU Express";
export const SITE_LANGUAGE = "en";
export const SITE_DESCRIPTION =
  "The student news publication of East West University. Campus heat, real stories, student voice — reported with care.";

/** The title used for social cards on pages without a more specific one. */
export const SITE_OG_TITLE = `${PUBLISHER_NAME} — Student News of East West University`;

/** Fragment ids that let one node reference another inside the same graph. */
export const ORGANIZATION_ID = "/#organization";
export const WEBSITE_ID = "/#website";

export interface SiteIdentity {
  /** Absolute origin with no trailing slash, e.g. https://example.com */
  url: string;
  /** Absolute URL of the publisher logo. */
  logo: string;
  description?: string;
}

/** The post columns the builders read. */
export interface StructuredPost {
  slug: string;
  title: string;
  caption: string;
  coverImage: string;
  category?: string | null;
  /** Raw `posts.tags` column: a JSON array of strings, or null/garbage. */
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageDescriptor {
  /** Site-absolute path, e.g. "/privacy". */
  path: string;
  name: string;
  description?: string;
}

/** A schema.org ListItem entry: a label plus the URL it points at. */
export interface ListEntry {
  name: string;
  url: string;
}

/**
 * UTC ISO-8601 from the `YYYY-MM-DD HH:MM:SS` strings stored in SQLite.
 * Undefined when the value is missing or unparseable — a wrong date in
 * structured data is worse than an absent one.
 */
export function isoDate(sqlDate: string | null | undefined): string | undefined {
  if (!sqlDate) return undefined;
  const date = parseUTCDate(sqlDate);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Reads the `posts.tags` column, which holds a JSON array written by the
 * editor. Anything else (null, a bare string, truncated JSON) yields an empty
 * list rather than throwing during a page render.
 */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Serialises a graph for a `<script type="application/ld+json">` tag.
 *
 * Escaping `<`, `>` and `&` is what makes this safe to inject with
 * `dangerouslySetInnerHTML`: raw `JSON.stringify` output would let a story
 * headline containing `</script>` close the tag and inject markup. The escapes
 * are valid JSON, so parsers read back the original characters.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Wraps nodes in one `@graph` document, dropping any that are absent. */
export function jsonLdGraph(nodes: unknown[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

/**
 * The publication itself. Google reads this for brand knowledge-panel
 * information and as the `publisher` of every story.
 */
export function organizationNode(site: SiteIdentity) {
  return {
    "@type": "NewsMediaOrganization",
    "@id": `${site.url}${ORGANIZATION_ID}`,
    name: PUBLISHER_NAME,
    alternateName: PUBLISHER_ALTERNATE_NAME,
    url: `${site.url}/`,
    description: site.description ?? SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: site.logo,
      // The published logo asset, so the declared size matches the file.
      width: 543,
      height: 648,
    },
  };
}

/**
 * The site as a whole, plus the sitelinks search box Google can show under the
 * brand result.
 */
export function websiteNode(site: SiteIdentity) {
  return {
    "@type": "WebSite",
    "@id": `${site.url}${WEBSITE_ID}`,
    name: PUBLISHER_NAME,
    alternateName: PUBLISHER_ALTERNATE_NAME,
    url: `${site.url}/`,
    description: site.description ?? SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": `${site.url}${ORGANIZATION_ID}` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** A plain page: the policies, the search page, anything without its own type. */
export function webPageNode(site: SiteIdentity, page: PageDescriptor) {
  const url = `${site.url}${page.path === "/" ? "/" : page.path}`;
  return {
    "@type": "WebPage",
    "@id": url,
    url,
    name: page.name,
    ...(page.description ? { description: page.description } : {}),
    inLanguage: SITE_LANGUAGE,
    isPartOf: { "@id": `${site.url}${WEBSITE_ID}` },
  };
}

/**
 * One story. This is what makes a result eligible for the article and Google
 * News rich treatments, so the headline, dates, image and section all come
 * straight from the published row.
 */
export function newsArticleNode(
  post: StructuredPost,
  site: SiteIdentity,
  categoryName?: string
) {
  const url = `${site.url}/article/${post.slug}`;
  const published = isoDate(post.createdAt);
  const modified = isoDate(post.updatedAt);
  const tags = parseTags(post.tags);

  return {
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    isPartOf: { "@id": `${site.url}${WEBSITE_ID}` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.title,
    description: post.caption,
    image: [post.coverImage],
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(categoryName ? { articleSection: categoryName } : {}),
    ...(tags.length ? { keywords: tags } : {}),
    inLanguage: SITE_LANGUAGE,
    isAccessibleForFree: true,
    publisher: { "@id": `${site.url}${ORGANIZATION_ID}` },
  };
}

/**
 * The trail Google prints under a result instead of the bare URL. The last
 * entry is intentionally left without a `url` field — self-referencing
 * breadcrumbs are read as noise.
 */
export function breadcrumbNode(crumbs: ListEntry[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(index === crumbs.length - 1 ? {} : { item: crumb.url }),
    })),
  };
}

/** A ranked list of stories — used for a section's front page. */
export function itemListNode(entries: ListEntry[], name?: string) {
  return {
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      url: entry.url,
    })),
  };
}

/**
 * A section front (a category page): the page node with its stories attached,
 * so the section's contents are understandable on their own.
 */
export function collectionPageNode(
  site: SiteIdentity,
  page: PageDescriptor,
  entries: ListEntry[]
) {
  return {
    // Reuses the page node (url, name, isPartOf) and only changes the type.
    ...webPageNode(site, page),
    "@type": "CollectionPage",
    ...(entries.length ? { mainEntity: itemListNode(entries, page.name) } : {}),
  };
}
