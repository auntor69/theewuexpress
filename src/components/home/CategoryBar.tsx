"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { useTheme } from "next-themes";
import { categories } from "@/lib/categories";
import { Flame, BookOpen, CalendarDays, Lightbulb } from "lucide-react";

const categoryIcons: Record<string, typeof Flame> = {
  "campus-heat": Flame,
  stories: BookOpen,
  events: CalendarDays,
  "did-you-know": Lightbulb,
};

export function CategoryBar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, index) => {
            const isHovered = hoveredSlug === cat.slug;
            const Icon = categoryIcons[cat.slug];

            const style = !mounted
              ? undefined
              : isHovered
                ? { background: "#ffdb57", color: "#000000" }
                : isDark
                  ? { background: "#f5f5f5", color: "#07226b" }
                  : { background: "#08216e", color: "#ffffff" };

            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-butter"
                  style={style}
                  onMouseEnter={() => setHoveredSlug(cat.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                >
                  {Icon && <Icon size={15} strokeWidth={2.25} />}
                  {cat.name}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
