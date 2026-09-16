import Image from "next/image";
import Link from "next/link";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import { timeAgo, estimateReadTime, formatViews } from "@/lib/utils";
import { Clock } from "lucide-react";

/**
 * Front page lead package — the broadsheet "above the fold" block.
 * Desktop: one dominant lead + two secondary stories in a right rail with
 * hairline rules. Mobile: dominant lead, then the secondaries as compact rows.
 * Purely server-rendered (no client JS, no carousel state) — instant paint.
 */
export function HeroSection({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 3);
  const mainCategory = getCategoryBySlug(mainPost.category);
  const mainReadTime = estimateReadTime(mainPost.content);

  return (
    <section className="container-editorial pt-5 sm:pt-8 pb-8 sm:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
        {/* Lead story — spans the page like a broadsheet's main block */}
        <div className="lg:col-span-8">
          <Link href={`/article/${mainPost.slug}`} className="group block">
            <div className="relative aspect-[16/9] overflow-hidden bg-raised">
              <Image
                src={mainPost.coverImage}
                alt={mainPost.title}
                fill
                priority
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-butter will-change-transform group-hover:scale-[1.035]"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-butter"
                style={{
                  background:
                    "linear-gradient(to top, rgba(15,23,42,0.25), transparent 40%)",
                }}
                aria-hidden
              />
            </div>

            <div className="pt-5">
              <div className="flex items-baseline gap-3 flex-wrap">
                {mainCategory && <span className="kicker">{mainCategory.name}</span>}
                <span className="text-faint text-[11px] uppercase tracking-wider">
                  {timeAgo(mainPost.createdAt)}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold leading-[1.12] tracking-tight mt-2.5 text-ink transition-colors duration-300 ease-butter group-hover:text-[var(--accent)]">
                {mainPost.title}
              </h1>

              <p className="text-muted text-base sm:text-lg leading-relaxed mt-3 max-w-2xl">
                {mainPost.caption}
              </p>

              <div className="flex items-center gap-3 text-faint text-xs uppercase tracking-wider mt-4">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {mainReadTime} min read
                </span>
                <span aria-hidden>&middot;</span>
                <span>{formatViews(mainPost.views)} reads</span>
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-[var(--accent)] font-semibold normal-case tracking-normal opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-butter"
                >
                  Read story
                  <span aria-hidden>&rarr;</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary stories — right rail with hairline rules, like a real paper */}
        {sidePosts.length > 0 && (
          <div className="lg:col-span-4 flex flex-col">
            <h2 className="kicker pb-3 hairline-b">More featured</h2>
            {/* flex-1 only from lg up: it exists to fill the tall desktop rail.
                On mobile the rows size to their content. */}
            <div className="lg:flex-1 flex flex-col divide-y divide-[var(--line)]">
              {sidePosts.map((post) => {
                const category = getCategoryBySlug(post.category);
                return (
                  <Link
                    key={post.id}
                    href={`/article/${post.slug}`}
                    className="group flex gap-4 py-4 sm:py-5 lg:flex-1 items-start"
                  >
                    <div className="flex-1 min-w-0">
                      {category && (
                        <span className="kicker">{category.name}</span>
                      )}
                      <h3 className="font-display text-lg font-semibold leading-snug mt-1 text-ink transition-colors duration-300 ease-butter group-hover:text-[var(--accent)] line-clamp-3">
                        {post.title}
                      </h3>
                      <p className="text-faint text-xs uppercase tracking-wider mt-2">
                        {timeAgo(post.createdAt)} &middot; {formatViews(post.views)} reads
                      </p>
                    </div>
                    <div className="relative w-24 h-20 sm:w-28 sm:h-24 flex-shrink-0 overflow-hidden bg-raised">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="128px"
                        className="object-cover transition-transform duration-700 ease-butter will-change-transform group-hover:scale-[1.08]"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
