import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { escapeLikePattern } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InfiniteFeed } from "@/components/home/InfiniteFeed";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { q?: string };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  return {
    title: searchParams.q
      ? `Search: ${searchParams.q} | The EWU Express`
      : "Search | The EWU Express",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q || "";

  let searchResults: typeof posts.$inferSelect[] = [];
  let totalCount = 0;

  if (query) {
    const escaped = '%' + escapeLikePattern(query) + '%';
    const searchCondition = sql`${posts.published} = 1 AND (${posts.title} LIKE ${escaped} ESCAPE '\\' OR ${posts.caption} LIKE ${escaped} ESCAPE '\\' OR ${posts.content} LIKE ${escaped} ESCAPE '\\')`;

    const [results, countResult] = await Promise.all([
      db.select().from(posts).where(searchCondition).orderBy(desc(posts.createdAt)).limit(6),
      db.select({ count: sql<number>`count(*)` }).from(posts).where(searchCondition),
    ]);

    searchResults = results;
    totalCount = Number(countResult[0]?.count || 0);
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />

      <div className="hairline-b bg-[var(--surface)]">
        <div className="container-editorial pt-12 pb-10">
          <p className="kicker">Search</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mt-2">
            {query ? `"${query}"` : "Find a story"}
          </h1>
          {query && (
            <p className="text-muted text-lg mt-3 font-display italic">
              {totalCount} {totalCount === 1 ? "story" : "stories"} found
            </p>
          )}
        </div>
      </div>

      <div className="container-editorial py-10">
        {query ? (
          <InfiniteFeed key={query} initialPosts={searchResults} search={query} />
        ) : (
          <div className="text-center py-20">
            <p className="text-muted text-lg">
              Use the search bar above to find stories.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
