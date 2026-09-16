/**
 * Resolves the canonical public origin of the site, used for absolute links
 * inside emails (and anywhere an absolute URL is needed server-side).
 *
 * Priority:
 *   1. site_url saved in the database (admin → Settings) — the source of truth.
 *   2. NEXT_PUBLIC_SITE_URL environment variable.
 *   3. Vercel's VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL.
 *   4. The known production domain as a last resort.
 */
const FALLBACK_SITE_URL = "https://theewuexpress.vercel.app";

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
