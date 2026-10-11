import Link from "next/link";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InfiniteFeed } from "@/components/home/InfiniteFeed";
import { getCategoryBySlug } from "@/lib/categories";
import { canonicalUrl, pageAlternates, resolveSiteUrl } from "@/lib/siteUrl";
import {
  PUBLISHER_NAME,
  breadcrumbNode,
  collectionPageNode,
  jsonLdGraph,
  organizationNode,
  serializeJsonLd,
} from "@/lib/structuredData";
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

function resolveCategory(slug: string) {
  return slug === UNCATEGORIZED.slug ? UNCATEGORIZED : getCategoryBySlug(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = resolveCategory(params.slug);
  if (!category) {
    return { title: "Section not found", robots: { index: false, follow: true } };
  }

  const path = `/category/${params.slug}`;

  return {
    // Bare section name: the root layout's template adds "| The EWU Express".
    title: category.name,
    description: category.description,
    alternates: pageAlternates(path),
    openGraph: {
      type: "website",
      title: `${category.name} — ${PUBLISHER_NAME}`,
      description: category.description,
      url: canonicalUrl(path),
      siteName: PUBLISHER_NAME,
      locale: "en_US",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const category = resolveCategory(params.slug);
  if (!category) notFound();

  const isUncategorized = params.slug === UNCATEGORIZED.slug;

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

  const site = { url: resolveSiteUrl(), logo: `${resolveSiteUrl()}/logo.png` };
  const sectionUrl = canonicalUrl(`/category/${params.slug}`);

  // The section front, its first page of stories, and the trail the reader
  // sees below — described the same way to search engines.
  const jsonLd = jsonLdGraph([
    organizationNode(site),
    collectionPageNode(
      site,
      {
        path: `/category/${params.slug}`,
        name: category.name,
        description: category.description,
      },
      categoryPosts.map((post) => ({
        name: post.title,
        url: `${site.url}/article/${post.slug}`,
      }))
    ),
    breadcrumbNode([
      { name: PUBLISHER_NAME, url: `${site.url}/` },
      { name: category.name, url: sectionUrl },
    ]),
  ]);

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />

      {/* Section opener — kicker, serif title, hairline */}
      <div className="hairline-b bg-[var(--surface)]">
        <div className="container-editorial pt-12 pb-10">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <li>
                <Link
                  href="/"
                  className="text-muted transition-colors duration-300 hover:text-[var(--accent)]"
                >
                  Front page
                </Link>
              </li>
              <li aria-hidden className="text-faint">
                /
              </li>
              <li className="text-faint" aria-current="page">
                {category.name}
              </li>
            </ol>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mt-4">
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
