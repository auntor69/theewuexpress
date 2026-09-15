"use client";

import { m as motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import { timeAgo, estimateReadTime, formatViews } from "@/lib/utils";
import { Eye, Clock } from "lucide-react";

interface PostCardProps {
  post: Post;
  index: number;
  variant?: "default" | "compact" | "wide";
}

export function PostCard({ post, index, variant = "default" }: PostCardProps) {
  const category = getCategoryBySlug(post.category);

  // Stagger must stay tiny as the infinite feed grows — with raw `index` the
  // 30th card would wait 1.5s to appear (feels broken on a slow connection).
  const stagger = Math.min(index % 6, 5) * 0.05;

  const categoryChip = category ? (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: category.color,
        backgroundColor: category.softBg,
      }}
    >
      {category.name}
    </span>
  ) : null;

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: stagger }}
      >
        <Link
          href={`/article/${post.slug}`}
          className="group flex gap-4 items-start"
        >
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            {categoryChip}
            <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 group-hover:text-red-500 transition-colors dark:text-white">
              {post.title}
            </h3>
            <div className="flex items-center gap-2 text-neutral-500 text-xs mt-1">
              <span>{formatViews(post.views)} views</span>
              <span>&middot;</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === "wide") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: stagger }}
      >
        <Link
          href={`/article/${post.slug}`}
          className="group flex flex-col sm:flex-row gap-4"
        >
          <div className="relative w-full sm:w-64 aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(min-width: 640px) 256px, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="flex-1">
            {categoryChip}
            <h3 className="font-display text-xl font-semibold leading-snug group-hover:text-red-500 transition-colors dark:text-white">
              {post.title}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 line-clamp-2">
              {post.caption}
            </p>
            <div className="flex items-center gap-3 text-neutral-400 text-xs mt-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {estimateReadTime(post.content)} min
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {formatViews(post.views)}
              </span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: stagger }}
    >
      <Link href={`/article/${post.slug}`} className="group block rounded-2xl">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3.5 shadow-sm group-hover:shadow-xl group-hover:shadow-neutral-900/5 dark:group-hover:shadow-black/20 transition-shadow duration-500">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {post.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-white/95 dark:bg-neutral-900/90 text-neutral-900 dark:text-white text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur">
                Featured
              </span>
            </div>
          )}
        </div>
        <div className="px-0.5">
          {categoryChip}
          <h3 className="font-display text-lg font-semibold leading-snug mt-1.5 group-hover:text-red-500 transition-colors dark:text-white line-clamp-2">
            {post.title}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1.5 line-clamp-2">
            {post.caption}
          </p>
          <div className="flex items-center gap-3 text-neutral-400 text-xs mt-2.5">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {estimateReadTime(post.content)} min
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {formatViews(post.views)}
            </span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
