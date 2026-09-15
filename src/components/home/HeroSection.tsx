"use client";

import { m as motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import { timeAgo, estimateReadTime, formatViews } from "@/lib/utils";
import { Eye, Clock } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface HeroSectionProps {
  posts: Post[];
}

function Meta({ post, small = false }: { post: Post; small?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-neutral-300 ${small ? "text-[11px]" : "text-xs"}`}>
      <span className="flex items-center gap-1">
        <Clock size={small ? 10 : 12} />
        {estimateReadTime(post.content)} min
      </span>
      <span className="flex items-center gap-1">
        <Eye size={small ? 10 : 12} />
        {formatViews(post.views)}
      </span>
      <span>{timeAgo(post.createdAt)}</span>
    </div>
  );
}

/** Stacked card with overlaid title — used for the main hero story and side/mobile slides. */
function HeroCard({
  post,
  priority = false,
  sizes,
  titleSize = "lg",
  showCaption = false,
  smallMeta = false,
}: {
  post: Post;
  priority?: boolean;
  sizes: string;
  titleSize?: "sm" | "lg";
  showCaption?: boolean;
  smallMeta?: boolean;
}) {
  const category = getCategoryBySlug(post.category);

  return (
    <Link href={`/article/${post.slug}`} className="group block h-full">
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes={sizes}
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5">
          {category && (
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-2"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          )}
          <h2
            className={`font-black text-white leading-tight mb-1.5 group-hover:text-red-400 transition-colors line-clamp-2 ${
              titleSize === "lg" ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            {post.title}
          </h2>
          {showCaption && (
            <p className="hidden sm:block text-neutral-300 text-sm line-clamp-2 mb-3">
              {post.caption}
            </p>
          )}
          <div className="mt-1.5">
            <Meta post={post} small={smallMeta} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HeroSection({ posts }: HeroSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  // Mobile: track horizontal swipes so the dots mirror what's on screen.
  const handleCarouselScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-carousel-slide]");
    const slideWidth = slide ? slide.offsetWidth + 12 : 1; // 12px = gap-3
    setActiveDot(Math.round(el.scrollLeft / slideWidth));
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-carousel-slide]");
    const slideWidth = slide ? slide.offsetWidth + 12 : 1;
    el.scrollTo({ left: slideWidth * index, behavior: "smooth" });
  }, []);

  if (!posts.length) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 3);
  const mainCategory = getCategoryBySlug(mainPost.category);
  const mainReadTime = estimateReadTime(mainPost.content);

  return (
    <section className="pt-6 sm:pt-8 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: main story + horizontal snap carousel for the rest */}
        <div className="lg:hidden">
          <HeroCard
            post={mainPost}
            priority
            sizes="100vw"
            titleSize="lg"
            showCaption
            smallMeta
          />

          {sidePosts.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  More featured
                </span>
                <span className="text-[11px] text-neutral-400">Swipe →</span>
              </div>
              <div
                ref={scrollerRef}
                onScroll={handleCarouselScroll}
                className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-hide"
              >
                {sidePosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    data-carousel-slide
                    className="w-[78%] sm:w-[46%] flex-shrink-0 snap-start"
                  >
                    <HeroCard post={post} sizes="80vw" titleSize="sm" smallMeta />
                  </motion.div>
                ))}
              </div>
              {sidePosts.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-1">
                  {sidePosts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToSlide(i)}
                      aria-label={`Go to featured story ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeDot === i
                          ? "w-5 bg-neutral-900 dark:bg-white"
                          : "w-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-500"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop: main story + stacked side cards */}
        <div className="hidden lg:grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2"
          >
            <Link href={`/article/${mainPost.slug}`} className="group block">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                <Image
                  src={mainPost.coverImage}
                  alt={mainPost.title}
                  fill
                  sizes="(min-width: 1280px) 860px, 66vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  {mainCategory && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
                      style={{ backgroundColor: mainCategory.color }}
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
                  <div className="flex items-center gap-3 text-neutral-300 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {mainReadTime} min
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
                  <Link href={`/article/${post.slug}`} className="group block">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        {category && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white mb-2"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        )}
                        <h2 className="text-lg font-bold text-white leading-tight group-hover:text-red-400 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <div className="mt-1">
                          <Meta post={post} small />
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
