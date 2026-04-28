"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { categories } from "@/lib/categories";

export function CategoryBar() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, index) => {
            const isHovered = hoveredSlug === cat.slug;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap hover:scale-105 transition-all duration-200 shadow-lg ${
                    isHovered
                      ? ""
                      : isDark
                        ? `bg-gradient-to-r ${cat.color} text-white`
                        : "bg-[#08216e] text-white"
                  }`}
                  style={
                    isHovered
                      ? { background: "#ffdb57", color: "#000000" }
                      : undefined
                  }
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
