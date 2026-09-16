import { db } from "@/db";
import { posts } from "@/db/schema";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { Dateline } from "@/components/layout/Dateline";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { PostCard } from "@/components/home/PostCard";
import { InfiniteFeed } from "@/components/home/InfiniteFeed";

export const dynamic = "force-dynamic";

/**
 * The front page never shows the same story twice: each block excludes what
 * the blocks above it already displayed. Sections live only in the masthead —
 * there is no second copy of them further down the page.
 */
async function getFeaturedPosts() {
  return db
    .select()
    .from(posts)
    .where(sql`${posts.published} = 1 AND ${posts.featured} = 1`)
    .orderBy(desc(posts.createdAt))
    .limit(3);
}

async function getMostRead(excludeIds: number[]) {
  const where = excludeIds.length
    ? and(eq(posts.published, true), notInArray(posts.id, excludeIds))
    : eq(posts.published, true);

  return db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.views))
    .limit(4);
}

async function getEditorPicks(excludeIds: number[]) {
  const base = sql`${posts.published} = 1 AND ${posts.editorPick} = 1`;
  const where = excludeIds.length
    ? sql`${base} AND ${notInArray(posts.id, excludeIds)}`
    : base;

  return db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(2);
}

async function getLatestPosts(excludeIds: number[]) {
  const where = excludeIds.length
    ? and(eq(posts.published, true), notInArray(posts.id, excludeIds))
    : eq(posts.published, true);

  return db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(6);
}

export default async function HomePage() {
  const featured = await getFeaturedPosts();
  const featuredIds = featured.map((p) => p.id);

  const mostRead = await getMostRead(featuredIds);
  const mostReadIds = [...featuredIds, ...mostRead.map((p) => p.id)];

  const editorPicks = await getEditorPicks(mostReadIds);
  const usedIds = [...mostReadIds, ...editorPicks.map((p) => p.id)];

  const latest = await getLatestPosts(usedIds);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />
      <Dateline />
      <HeroSection posts={featured} />

      {/* Most read — a ranked list, the way papers actually present it */}
      {mostRead.length > 0 && (
        <section className="container-editorial pt-10 pb-6">
          <SectionHeader title="Most Read" />
          <ol className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
            {mostRead.map((post, i) => (
              <li key={post.id} className="hairline-b">
                <a
                  href={`/article/${post.slug}`}
                  className="group flex items-baseline gap-4 py-4"
                >
                  <span className="font-display text-xl font-semibold text-[var(--gold)] w-7 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[17px] font-semibold leading-snug text-ink transition-colors duration-300 ease-butter group-hover:text-[var(--accent)]">
                    {post.title}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Editor's picks — two wide rows with imagery */}
      {editorPicks.length > 0 && (
        <section className="container-editorial pt-6 pb-6">
          <SectionHeader title="Editor's Picks" />
          {editorPicks.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} variant="wide" />
          ))}
        </section>
      )}

      {/* Latest — the living feed */}
      <section className="container-editorial pt-6 pb-12">
        <SectionHeader title="Latest Stories" />
        <InfiniteFeed initialPosts={latest} excludeIds={usedIds} />
      </section>

      <Footer />
      <BackToTop />
    </main>
  );
}
