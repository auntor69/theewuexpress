"use client";

import { m as motion } from "framer-motion";

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
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {accent && (
            <div className="w-1.5 h-9 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
          )}
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-neutral-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {accent && (
          <div className="hidden sm:flex h-px flex-1 max-w-[200px] bg-gradient-to-r from-neutral-200 to-transparent dark:from-neutral-800 mb-2" />
        )}
      </div>
    </motion.div>
  );
}
