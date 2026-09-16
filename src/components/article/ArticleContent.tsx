"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  Eye,
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";

interface ArticleContentProps {
  post: Post;
  /** Story HTML already sanitized on the server (see lib/sanitizeContent). */
  safeContent: string;
}

export function ArticleContent({ post, safeContent }: ArticleContentProps) {
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

  const [shareUrl, setShareUrl] = useState(`/article/${post.slug}`);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.caption,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

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
              <span className="kicker" style={{ color: category.color }}>
                {category.name}
              </span>
            </div>
          )}

          <h1 className="font-display text-[2rem] sm:text-[2.75rem] font-semibold leading-[1.12] tracking-tight text-ink mt-3">
            {post.title}
          </h1>

          <p className="text-muted text-lg leading-relaxed mt-4 font-display italic">
            {post.caption}
          </p>

          {/* Byline + tools on a hairline rule */}
          <div className="flex items-center justify-between gap-4 hairline-t hairline-b py-3.5 mt-8">
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

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-[var(--raised)] transition-colors text-muted hover:text-ink"
                aria-label="Share"
              >
                <Share2 size={15} />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-[var(--raised)] transition-colors text-muted hover:text-ink"
                aria-label="Share on Twitter"
              >
                <ExternalLink size={15} />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-[var(--raised)] transition-colors text-muted hover:text-ink"
                aria-label="Share on Facebook"
              >
                <ExternalLink size={15} />
              </a>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-full hover:bg-[var(--raised)] transition-colors text-muted hover:text-ink"
                aria-label="Copy link"
              >
                <Link2 size={15} />
              </button>
            </div>
          </div>
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

        {/* Byline card */}
        <div className="bg-surface border border-line rounded-md p-6 flex items-center gap-4 mb-4">
          <Image
            src="/logo.png"
            alt="The EWU Express"
            width={44}
            height={44}
            className="rounded-md"
          />
          <div>
            <p className="kicker">Published by</p>
            <p className="font-display font-bold text-ink leading-tight mt-0.5">
              The EWU Express
            </p>
            <p className="text-muted text-sm">
              The student news publication of East West University
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
