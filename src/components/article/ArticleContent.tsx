"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
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
}

export function ArticleContent({ post }: ArticleContentProps) {
  const category = getCategoryBySlug(post.category);
  const contentRef = useRef<HTMLDivElement>(null);

  const sanitizedContent = useMemo(
    () =>
      DOMPurify.sanitize(post.content, {
        ALLOWED_TAGS: [
          "p", "h1", "h2", "h3", "h4", "h5", "h6",
          "blockquote", "ul", "ol", "li", "a", "strong", "em",
          "u", "s", "mark", "code", "pre", "sub", "sup",
          "img", "br", "hr", "span", "div", "figure", "figcaption",
        ],
        ALLOWED_ATTR: [
          "href", "src", "alt", "title", "class", "target", "rel",
          "style", "start", "loading",
        ],
      }),
    [post.content]
  );

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
  }, [sanitizedContent]);

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
    <article className="pt-20">
      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
        <motion.div
          initial={{ scale: 1.06, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-950 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to feed
          </Link>

          {category && (
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          )}

          <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-[1.1] tracking-tight dark:text-white mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-6 font-display italic">
            {post.caption}
          </p>

          <div className="flex items-center justify-between border-y border-neutral-200 dark:border-neutral-800 py-4 mb-10">
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span className="uppercase tracking-wider text-xs font-medium">
                By The EWU Express Desk
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {estimateReadTime(post.content)} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {formatViews(post.views)} views
              </span>
              <span className="hidden sm:block">{formatDate(post.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Share"
              >
                <Share2 size={16} className="dark:text-neutral-400" />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Share on Twitter"
              >
                <ExternalLink size={16} className="dark:text-neutral-400" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Share on Facebook"
              >
                <ExternalLink size={16} className="dark:text-neutral-400" />
              </a>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Copy link"
              >
                <Link2 size={16} className="dark:text-neutral-400" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          ref={contentRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="article-content prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-black prose-headings:tracking-tight
            prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-p:leading-relaxed
            prose-blockquote:border-l-4 prose-blockquote:border-red-500
            prose-blockquote:bg-neutral-50 dark:prose-blockquote:bg-neutral-900
            prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6
            prose-blockquote:not-italic prose-blockquote:font-medium
            prose-blockquote:text-neutral-800 dark:prose-blockquote:text-neutral-200
            prose-a:text-red-500 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl
            prose-strong:text-neutral-900 dark:prose-strong:text-white
            prose-li:text-neutral-700 dark:prose-li:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        <div className="border-t border-neutral-200 dark:border-neutral-800 mt-16 pt-8">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="EWU Express" width={48} height={48} className="rounded-full" />
            <div>
              <p className="font-bold dark:text-white">The EWU Express</p>
              <p className="text-sm text-neutral-500">
                The voice of East West University
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
