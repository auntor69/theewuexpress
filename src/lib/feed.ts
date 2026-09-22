/**
 * Small shared helpers for the RSS feed. Kept separate from the feed route so
 * they can be unit-tested without Next.js imports.
 */

/** Strips HTML tags and collapses whitespace — for feed descriptions. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * XML-escapes text and attribute values. `&` first, then the four reserved
 * characters; control characters that are illegal in XML 1.0 are dropped so a
 * pasted story can never produce invalid feed markup.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 date from the UTC "YYYY-MM-DD HH:MM:SS" strings stored in the DB. */
export function toRfc822(utcSqlDate: string): string | undefined {
  if (!utcSqlDate) return undefined;
  // Bare "YYYY-MM-DD HH:MM:SS" parses as local time in JS; force UTC by
  // rewriting it as ISO with an explicit Z (same convention as utils.parseUTCDate).
  const date = new Date(utcSqlDate.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toUTCString();
}
