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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);
  if (!category) return { title: "Not Found" };

  return {
    title: `${category.name} | The EWU Express`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();

  const categoryPosts = await db
    .select()
    .from(posts)
    .where(sql`${posts.published} = 1 AND ${posts.category} = ${params.slug}`)
    .orderBy(desc(posts.createdAt))
    .limit(6);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-lg mb-4 bg-[#08216e] text-white dark:bg-[#f5f5f5] dark:text-[#07226b]"
            >
              <span className="text-2xl">{category.emoji}</span>
              {category.name}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              {category.description}
            </p>
          </div>
          <InfiniteFeed key={params.slug} initialPosts={categoryPosts} category={params.slug} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
