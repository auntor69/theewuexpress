"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { categories } from "@/lib/categories";

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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap hover:scale-105 transition-all duration-200 shadow-lg bg-neutral-300 dark:bg-neutral-700"
                  style={style}
                  onMouseEnter={() => setHoveredSlug(cat.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                >
                  <span className="text-lg">{cat.emoji}</span>
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
