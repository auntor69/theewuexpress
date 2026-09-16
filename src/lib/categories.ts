export const categories = [
  {
    slug: "campus-heat",
    name: "Campus Heat",
    description: "The pulse of university life",
    color: "#ea580c",
    softBg: "rgba(234, 88, 12, 0.12)",
  },
  {
    slug: "stories",
    name: "Stories",
    description: "Tales that define us",
    color: "#0891b2",
    softBg: "rgba(8, 145, 178, 0.12)",
  },
  {
    slug: "events",
    name: "Events",
    description: "Don't miss out",
    color: "#d97706",
    softBg: "rgba(217, 119, 6, 0.14)",
  },
  {
    slug: "did-you-know",
    name: "Did You Know?",
    description: "Facts and finds about your campus",
    color: "#7c3aed",
    softBg: "rgba(124, 58, 237, 0.12)",
  },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export function getCategoryBySlug(slug: string | null | undefined) {
  if (!slug) return undefined;
  return categories.find((c) => c.slug === slug);
}
