export const categories = [
  {
    slug: "campus-heat",
    name: "Campus Heat",
    description: "The pulse of university life",
    emoji: "🔥",
    color: "from-orange-500 to-red-500",
    darkColor: "dark:from-orange-500 dark:to-red-500",
  },
  {
    slug: "confessions",
    name: "Confessions",
    description: "Raw, honest, unfiltered",
    emoji: "🤫",
    color: "from-purple-500 to-pink-500",
    darkColor: "dark:from-purple-500 dark:to-pink-500",
  },
  {
    slug: "stories",
    name: "Stories",
    description: "Tales that define us",
    emoji: "📖",
    color: "from-blue-500 to-cyan-500",
    darkColor: "dark:from-blue-500 dark:to-cyan-500",
  },
  {
    slug: "real-talk",
    name: "Real Talk",
    description: "No filter, no pretense",
    emoji: "💬",
    color: "from-green-500 to-emerald-500",
    darkColor: "dark:from-green-500 dark:to-emerald-500",
  },
  {
    slug: "events",
    name: "Events",
    description: "Don't miss out",
    emoji: "🎉",
    color: "from-yellow-500 to-orange-500",
    darkColor: "dark:from-yellow-500 dark:to-orange-500",
  },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
