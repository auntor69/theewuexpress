"use client";

import Image from "next/image";
import Link from "next/link";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import { timeAgo, estimateReadTime, formatViews, cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";
import { m as motion } from "framer-motion";

interface PostCardProps {
  post: Post;
  index: number;
  variant?: "default" | "compact" | "wide";
}

/**
 * Editorial card — typography-first, quiet borders, warm paper elevation.
 * Hover: image zooms subtly inside its frame, headline warms to accent,
 * a hairline gold underline draws itself under the headline.
 */
export function PostCard({ post, index, variant = "default" }: PostCardProps) {
  const category = getCategoryBySlug(post.category);

  // Stagger must stay tiny as the infinite feed grows — with raw `index` the
  // 30th card would wait 1.5s to appear (feels broken on a slow connection).
  const stagger = Math.min(index % 6, 5) * 0.05;

  const categoryLabel = category ? (
    <span
      className="kicker"
      style={category ? { color: category.color } : undefined}
    >
      {category.name}
    </span>
  ) : null;

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: stagger, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href={`/article/${post.slug}`}
          className="group flex gap-4 items-start py-4 hairline-b"
        >
          <div className="relative w-20 h-20 overflow-hidden flex-shrink-0 bg-raised">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-700 ease-butter will-change-transform group-hover:scale-[1.08]"
            />
          </div>
          <div className="flex-1 min-w-0">
            {categoryLabel}
            <h3 className="font-display font-semibold text-[15px] leading-snug mt-1 text-ink transition-colors duration-300 ease-butter group-hover:text-[var(--accent)] line-clamp-2">
              {post.title}
            </h3>
            <div className="flex items-center gap-2 text-muted text-xs mt-1.5">
              <span>{timeAgo(post.createdAt)}</span>
              <span aria-hidden>&middot;</span>
              <span>{formatViews(post.views)} reads</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === "wide") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: stagger, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href={`/article/${post.slug}`}
          className="group flex flex-col sm:flex-row gap-6 py-6 hairline-b"
        >
          <div className="relative w-full sm:w-64 aspect-video sm:aspect-[4/3] overflow-hidden flex-shrink-0 bg-raised">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(min-width: 640px) 256px, 100vw"
              className="object-cover transition-transform duration-700 ease-butter will-change-transform group-hover:scale-[1.05]"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {categoryLabel}
            <h3 className="font-display text-2xl font-semibold leading-snug mt-1.5 text-ink transition-colors duration-300 ease-butter group-hover:text-[var(--accent)]">
              {post.title}
            </h3>
            <p className="text-muted text-[15px] leading-relaxed mt-2 line-clamp-2">
              {post.caption}
            </p>
            <div className="flex items-center gap-3 text-faint text-xs mt-4 uppercase tracking-wider">
              <span>{formatDate(post.createdAt)}</span>
              <span aria-hidden>&middot;</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {estimateReadTime(post.content)} min read
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: stagger, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/article/${post.slug}`}
        className="group block bg-surface border border-line rounded-md overflow-hidden shadow-paper transition-all duration-500 ease-butter will-change-transform hover:shadow-paper-lg hover:-translate-y-1"
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-raised">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-butter will-change-transform group-hover:scale-[1.06]"
          />
          {post.featured && (
            <span className="absolute top-3 left-3 bg-[#0f2a5c] text-[#f5efe0] text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1">
              Featured
            </span>
          )}
        </div>

        <div className="p-5">
          {categoryLabel}
          <div className="relative inline-block">
            <h3 className="font-display text-xl font-semibold leading-snug mt-1.5 text-ink transition-colors duration-300 ease-butter group-hover:text-[var(--accent)] line-clamp-2">
              {post.title}
            </h3>
            <span
              className="absolute left-0 -bottom-0.5 h-[2px] w-full origin-left scale-x-0 bg-[var(--gold)] transition-transform duration-500 ease-butter group-hover:scale-x-100"
              aria-hidden
            />
          </div>
          <p className="text-muted text-sm leading-relaxed mt-2 line-clamp-2">
            {post.caption}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 hairline-t">
            <div className="flex items-center gap-2.5 text-faint text-[11px] uppercase tracking-wider">
              <span>{timeAgo(post.createdAt)}</span>
              <span aria-hidden>&middot;</span>
              <span>{estimateReadTime(post.content)} min</span>
              <span aria-hidden>&middot;</span>
              <span>{formatViews(post.views)}</span>
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-semibold text-[var(--accent)]",
                "sm:opacity-0 sm:-translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0",
                "transition-all duration-400 ease-butter"
              )}
            >
              Read
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function formatDate(dateString: string): string {
  return new Date(
    dateString.endsWith("Z") || dateString.includes("+")
      ? dateString
      : dateString.replace(" ", "T") + "Z"
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
