/**
 * Resolves the canonical public origin of the site, used for absolute links
 * inside emails (and anywhere an absolute URL is needed server-side).
 *
 * Priority:
 *   1. site_url saved in the database (admin → Settings) — the source of truth.
 *   2. NEXT_PUBLIC_SITE_URL environment variable.
 *   3. Vercel's VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL.
 *   4. The live production domain as a last resort.
 *
 * Keep the fallback on the real public domain: it is what local runs, previews
 * and any deployment without the env vars above declare as canonical.
 */
const FALLBACK_SITE_URL = "https://theewuexpress.online";

function normalizeUrl(candidate: string): string {
  const trimmed = candidate.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:/i, "https:");
  }
  return `https://${trimmed}`;
}

export function resolveSiteUrl(dbSiteUrl?: string | null): string {
  const fromDb = dbSiteUrl?.trim();
  if (fromDb) return normalizeUrl(fromDb);

  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (fromEnv) return normalizeUrl(fromEnv);

  return FALLBACK_SITE_URL;
}

/** Absolute URL for an article — the exact link subscribers click in the email. */
export function articleUrl(post: { slug: string }, dbSiteUrl?: string | null): string {
  return `${resolveSiteUrl(dbSiteUrl)}/article/${post.slug}`;
}

/**
 * Absolute canonical URL for a path on this site.
 *
 * Deliberately built from the configured origin rather than the request host:
 * a preview deployment must not declare itself canonical, or the preview and
 * the live article would compete for the same query in search results.
 */
export function canonicalUrl(pathname = "/", dbSiteUrl?: string | null): string {
  const base = resolveSiteUrl(dbSiteUrl);
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") return `${base}/`;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path.replace(/\/+$/, "")}`;
}

/**
 * The `<link>` relations every page carries: its own canonical URL plus the
 * RSS feed. Returned as one object because Next resolves `alternates` per
 * field, not by merging — a page that set only `canonical` would silently
 * drop the feed link it inherited from the root layout.
 */
export function pageAlternates(pathname = "/", dbSiteUrl?: string | null) {
  return {
    canonical: canonicalUrl(pathname, dbSiteUrl),
    types: { "application/rss+xml": "/rss" },
  };
}
