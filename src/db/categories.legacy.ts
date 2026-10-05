/**
 * Legacy-category remapping for the import path of src/db/migrate.ts.
 * Kept in its own module so the rule can be unit-tested without touching a
 * database: anything removed from the live category list (or empty/garbage)
 * imports as NULL — the "uncategorized" pool the admin assigns from.
 */

/** Categories that existed in early versions and were later removed. */
export const LEGACY_CATEGORIES = ["confessions", "real-talk"];

export function categoryOrNull(category: unknown): string | null {
  const value =
    typeof category === "string" ? category.toLowerCase().trim() : "";
  if (!value || LEGACY_CATEGORIES.includes(value)) return null;
  return value;
}
