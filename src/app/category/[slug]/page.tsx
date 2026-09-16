import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InfiniteFeed } from "@/components/home/InfiniteFeed";
import { getCategoryBySlug } from "@/lib/categories";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

const UNCATEGORIZED = {
  slug: "uncategorized",
  name: "Uncategorized",
  description: "Stories waiting to be sorted",
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isUncategorized = params.slug === UNCATEGORIZED.slug;
  const category = isUncategorized ? UNCATEGORIZED : getCategoryBySlug(params.slug);
  if (!category) return { title: "Not Found" };

  return {
    title: `${category.name} | The EWU Express`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const isUncategorized = params.slug === UNCATEGORIZED.slug;
  const category = isUncategorized ? UNCATEGORIZED : getCategoryBySlug(params.slug);
  if (!category) notFound();

  const categoryPosts = await db
    .select()
    .from(posts)
    .where(
      isUncategorized
        ? sql`${posts.published} = 1 AND ${posts.category} IS NULL`
        : sql`${posts.published} = 1 AND ${posts.category} = ${params.slug}`
    )
    .orderBy(desc(posts.createdAt))
    .limit(6);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />

      {/* Section opener — kicker, serif title, hairline */}
      <div className="hairline-b bg-[var(--surface)]">
        <div className="container-editorial pt-12 pb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink">
            {category.name}
          </h1>
          <p className="text-muted text-base mt-2">{category.description}</p>
        </div>
      </div>

      <div className="container-editorial py-10">
        <InfiniteFeed key={params.slug} initialPosts={categoryPosts} category={params.slug} />
      </div>
      <Footer />
    </main>
  );
}
