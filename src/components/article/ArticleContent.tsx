"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import {
  formatDate,
  estimateReadTime,
  formatViews,
} from "@/lib/utils";
import { Eye, Clock, ArrowLeft } from "lucide-react";
import { ShareRow } from "@/components/article/ShareRow";

interface ArticleContentProps {
  post: Post;
  /** Story HTML already sanitized on the server (see lib/sanitizeContent). */
  safeContent: string;
  /** Absolute story URL, resolved on the server so share links work before hydration. */
  canonicalUrl: string;
}

export function ArticleContent({
  post,
  safeContent,
  canonicalUrl,
}: ArticleContentProps) {
  const category = getCategoryBySlug(post.category);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/posts/${post.id}/views`, { method: "POST" }).catch(() => {});
  }, [post.id]);

  // Body images come from imgbb as raw <img> tags — add lazy-loading so
  // below-fold photos never compete with the article for bandwidth.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    root.querySelectorAll("img").forEach((img) => {
      img.loading = "lazy";
      img.decoding = "async";
    });
  }, [safeContent]);

  return (
    <article className="pt-16 sm:pt-[72px]">
      {/* Framed hero image — newspaper photograph above the fold */}
      <div className="container-editorial pt-6 sm:pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-raised"
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </div>

      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-[var(--accent)] mt-8 transition-colors duration-300"
          >
            <ArrowLeft size={13} />
            Front page
          </Link>

          {category && (
            <div className="mt-6">
              <span className="kicker">{category.name}</span>
            </div>
          )}

          <h1 className="font-display text-[2rem] sm:text-[2.75rem] font-semibold leading-[1.12] tracking-tight text-ink mt-3">
            {post.title}
          </h1>

          <p className="text-muted text-lg leading-relaxed mt-4 font-display italic">
            {post.caption}
          </p>

          {/* Byline on a hairline rule */}
          <div className="hairline-t hairline-b py-3.5 mt-8">
            <div className="flex items-center gap-4 text-xs text-muted uppercase tracking-wider min-w-0">
              <span className="font-semibold text-ink whitespace-nowrap">
                The EWU Express Desk
              </span>
              <span className="hidden sm:inline text-faint whitespace-nowrap">
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock size={12} />
                {estimateReadTime(post.content)} min
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Eye size={12} />
                {formatViews(post.views)}
              </span>
            </div>
          </div>

          <ShareRow
            title={post.title}
            caption={post.caption}
            url={canonicalUrl}
            className="mt-4"
          />
        </motion.div>

        <motion.div
          ref={contentRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="article-content prose prose-lg max-w-none my-10
            prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-ink
            prose-p:text-[#3f3a34] dark:prose-p:text-[#c9c2b6] prose-p:leading-[1.85]
            prose-blockquote:border-l-2 prose-blockquote:border-[var(--gold)]
            prose-blockquote:bg-[var(--raised)] prose-blockquote:rounded-r-md
            prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic
            prose-blockquote:font-display prose-blockquote:text-xl prose-blockquote:leading-relaxed
            prose-blockquote:text-ink
            prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-md prose-img:shadow-paper
            prose-strong:text-ink
            prose-li:text-[#3f3a34] dark:prose-li:text-[#c9c2b6]
            prose-hr:border-[var(--line)]"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        {/* Repeat the share actions where readers actually finish the story. */}
        <div className="mt-4 mb-16 pt-8 hairline-t">
          <ShareRow
            title={post.title}
            caption={post.caption}
            url={canonicalUrl}
            heading="Share this story"
          />
        </div>
      </div>
    </article>
  );
}
