import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InfiniteFeed } from "@/components/home/InfiniteFeed";
import { Search } from "lucide-react";
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

  if (query) {
    searchResults = await db
      .select()
      .from(posts)
      .where(
        sql`${posts.published} = 1 AND (${posts.title} LIKE ${'%' + query + '%'} OR ${posts.caption} LIKE ${'%' + query + '%'} OR ${posts.content} LIKE ${'%' + query + '%'})`
      )
      .orderBy(desc(posts.createdAt))
      .limit(6);
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Search size={24} className="text-neutral-400" />
              <h1 className="text-3xl font-black dark:text-white">
                {query ? `Results for "${query}"` : "Search"}
              </h1>
            </div>
            {query && (
              <p className="text-neutral-500">
                {searchResults.length} {searchResults.length === 1 ? "story" : "stories"} found
              </p>
            )}
          </div>

          {query ? (
            <InfiniteFeed initialPosts={searchResults} search={query} />
          ) : (
            <div className="text-center py-20">
              <p className="text-neutral-400 text-lg">
                Use the search bar above to find stories.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
