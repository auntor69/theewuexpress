import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { Dateline } from "@/components/layout/Dateline";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryBar } from "@/components/home/CategoryBar";
import { SectionHeader } from "@/components/home/SectionHeader";
import { PostCard } from "@/components/home/PostCard";
import { InfiniteFeed } from "@/components/home/InfiniteFeed";

export const dynamic = "force-dynamic";

async function getFeaturedPosts() {
  return db
    .select()
    .from(posts)
    .where(sql`${posts.published} = 1 AND ${posts.featured} = 1`)
    .orderBy(desc(posts.createdAt))
    .limit(3);
}

async function getTrendingPosts() {
  return db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.views))
    .limit(4);
}

async function getEditorPicks() {
  return db
    .select()
    .from(posts)
    .where(sql`${posts.published} = 1 AND ${posts.editorPick} = 1`)
    .orderBy(desc(posts.createdAt))
    .limit(2);
}

async function getLatestPosts() {
  return db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt))
    .limit(6);
}

export default async function HomePage() {
  const [featured, trending, editorPicks, latest] = await Promise.all([
    getFeaturedPosts(),
    getTrendingPosts(),
    getEditorPicks(),
    getLatestPosts(),
  ]);

  const trendingList = trending.slice(2);
  const trendingCards = trending.slice(0, 2);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />
      <Dateline />
      <HeroSection posts={featured} />
      <CategoryBar />

      {/* Most read — ranked list beside two cards, print-style "Most read" rail */}
      {trending.length > 0 && (
        <section className="container-editorial py-12">
          <SectionHeader title="Most Read" subtitle="What the campus is reading right now" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {trendingCards.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
            <div className="lg:col-span-5">
              <div className="bg-surface border border-line rounded-md p-6 h-full">
                <p className="kicker mb-4">The countdown</p>
                <div className="flex flex-col divide-y divide-[var(--line)]">
                  {trendingList.map((post, i) => (
                    <a
                      key={post.id}
                      href={`/article/${post.slug}`}
                      className="group flex items-baseline gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <span className="font-display text-2xl font-semibold text-[var(--gold)] w-8 flex-shrink-0">
                        {String(i + 3).padStart(2, "0")}
                      </span>
                      <span className="font-display text-[15px] font-semibold leading-snug text-ink group-hover:text-[var(--accent)] transition-colors duration-300 ease-butter line-clamp-2">
                        {post.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Editor's picks — wide horizontal rows, magazine style */}
      {editorPicks.length > 0 && (
        <section className="container-editorial py-6">
          <SectionHeader
            title="Editor's Picks"
            subtitle="Hand-picked by our editorial team"
          />
          <div className="grid grid-cols-1 gap-0">
            {editorPicks.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} variant="wide" />
            ))}
          </div>
        </section>
      )}

      {/* Latest — the living feed */}
      <section className="container-editorial py-12">
        <SectionHeader title="Latest Stories" subtitle="Fresh off the press" />
        <InfiniteFeed initialPosts={latest} />
      </section>

      <Footer />
      <BackToTop />
    </main>
  );
}
