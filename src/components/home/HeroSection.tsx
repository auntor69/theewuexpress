"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import { timeAgo, estimateReadTime, formatViews } from "@/lib/utils";
import { Eye, Clock } from "lucide-react";

interface HeroSectionProps {
  posts: Post[];
}

export function HeroSection({ posts }: HeroSectionProps) {
  if (!posts.length) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 3);
  const mainCategory = getCategoryBySlug(mainPost.category);

  return (
    <section className="pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Link href={`/article/${mainPost.slug}`} className="group block">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                <Image
                  src={mainPost.coverImage}
                  alt={mainPost.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  {mainCategory && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${mainCategory.color} mb-3`}
                    >
                      {mainCategory.name}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2 group-hover:text-red-400 transition-colors">
                    {mainPost.title}
                  </h1>
                  <p className="text-neutral-300 text-sm sm:text-base line-clamp-2 mb-3">
                    {mainPost.caption}
                  </p>
                  <div className="flex items-center gap-4 text-neutral-400 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {estimateReadTime(mainPost.content)} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatViews(mainPost.views)}
                    </span>
                    <span>{timeAgo(mainPost.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          <div className="flex flex-col gap-4">
            {sidePosts.map((post, index) => {
              const category = getCategoryBySlug(post.category);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Link
                    href={`/article/${post.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        {category && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${category.color} mb-2`}
                          >
                            {category.name}
                          </span>
                        )}
                        <h2 className="text-lg font-bold text-white leading-tight group-hover:text-red-400 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <div className="flex items-center gap-3 text-neutral-400 text-xs mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={10} />
                            {formatViews(post.views)}
                          </span>
                          <span>{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
