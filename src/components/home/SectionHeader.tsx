"use client";

import { m as motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accent?: boolean;
  /** Renders a "View all" link on the right, pointing here. */
  href?: string;
}

/**
 * Editorial section opener: display-serif title, optional subtitle,
 * and a "View all" affordance with a sliding-arrow micro-interaction.
 */
export function SectionHeader({
  title,
  subtitle,
  accent = false,
  href,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {accent && (
            <div className="w-1 self-stretch bg-gradient-to-b from-red-500 to-orange-500 rounded-full mt-1" />
          )}
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="group/link hidden sm:inline-flex items-center gap-1.5 pb-1 text-sm font-medium text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors duration-300"
          >
            View all
            <ArrowRight
              size={14}
              className="transition-transform duration-300 ease-butter group-hover/link:translate-x-1"
            />
          </Link>
        )}
        {accent && !href && (
          <div className="hidden sm:flex h-px flex-1 max-w-[200px] bg-gradient-to-r from-neutral-200 to-transparent dark:from-neutral-800 mb-2" />
        )}
      </div>
    </motion.div>
  );
}
