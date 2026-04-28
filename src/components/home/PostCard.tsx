"use client";

import { motion } from "framer-motion";
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

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
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
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            {category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                {category.name}
              </span>
            )}
            <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-red-500 transition-colors dark:text-white">
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
        transition={{ delay: index * 0.05 }}
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
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="flex-1">
            {category && (
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${category.color} mb-2`}
              >
                {category.name}
              </span>
            )}
            <h3 className="text-xl font-bold leading-tight group-hover:text-red-500 transition-colors dark:text-white">
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
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/article/${post.slug}`} className="group block">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {post.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Featured
              </span>
            </div>
          )}
        </div>
        <div>
          {category && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
              {category.name}
            </span>
          )}
          <h3 className="text-lg font-bold leading-tight mt-1 group-hover:text-red-500 transition-colors dark:text-white line-clamp-2">
            {post.title}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 line-clamp-2">
            {post.caption}
          </p>
          <div className="flex items-center gap-3 text-neutral-400 text-xs mt-2">
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
