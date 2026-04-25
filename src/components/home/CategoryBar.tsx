"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { categories } from "@/lib/categories";

export function CategoryBar() {
  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/category/${cat.slug}`}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r ${cat.color} text-white font-bold text-sm whitespace-nowrap hover:scale-105 transition-transform shadow-lg`}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
