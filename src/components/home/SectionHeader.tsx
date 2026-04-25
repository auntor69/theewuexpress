"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accent?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  accent = false,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      <div className="flex items-center gap-3">
        {accent && (
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
        )}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-neutral-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
