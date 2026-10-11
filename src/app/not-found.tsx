import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { categories } from "@/lib/categories";

/**
 * A missing URL answers with a real 404 status and a page that is useful
 * rather than a dead end: the sections and the front page are one click away,
 * so a stale link (the usual way a story URL goes missing — it was renamed or
 * unpublished) still lands the reader somewhere they can keep reading.
 *
 * Kept out of the index explicitly: the root layout's `index, follow` is
 * inherited by this route, and a 404 is only ever a dead end to a crawler.
 * (Next adds a `noindex` of its own here as well — the two agree, and Next's
 * is the one that would remain if this declaration were ever removed.)
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />

      <section className="container-editorial py-16 sm:py-24">
        <p className="kicker">Error 404</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          This page never made it past the copy desk.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          The link you followed doesn&apos;t exist — the story may have been
          renamed, taken down, or the address mistyped. Everything we have
          published is still a click away.
        </p>

        <nav className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-[#0f2a5c] px-6 py-3 text-sm font-bold text-white transition-opacity duration-300 hover:opacity-90 dark:bg-[#c9a227] dark:text-[#0f2a5c]"
          >
            Back to the front page
          </Link>
          <Link
            href="/search"
            className="rounded-md border border-[var(--line-strong)] px-6 py-3 text-sm font-bold text-ink transition-colors duration-300 hover:bg-[var(--raised)]"
          >
            Search the archive
          </Link>
        </nav>

        <div className="mt-12 hairline-t pt-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
            Sections
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="font-display text-lg font-semibold text-ink transition-colors duration-300 hover:text-[var(--accent)]"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
}
