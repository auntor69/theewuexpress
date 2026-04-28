import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
    .limit(6);
}

async function getEditorPicks() {
  return db
    .select()
    .from(posts)
    .where(sql`${posts.published} = 1 AND ${posts.editorPick} = 1`)
    .orderBy(desc(posts.createdAt))
    .limit(4);
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

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection posts={featured} />
      <CategoryBar />

      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <SectionHeader
            title="Trending Now"
            subtitle="Most viewed stories this week"
            accent
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        </section>
      )}

      {editorPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <SectionHeader
            title="Editor&apos;s Picks"
            subtitle="Hand-picked by our editorial team"
            accent
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {editorPicks.slice(0, 2).map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
          {editorPicks.length > 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {editorPicks.slice(2).map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SectionHeader
          title="Latest Stories"
          subtitle="Fresh off the press"
          accent
        />
        <InfiniteFeed initialPosts={latest} />
      </section>

      <Footer />
    </main>
  );
}
