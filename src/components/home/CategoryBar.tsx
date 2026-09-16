import Link from "next/link";
import { categories } from "@/lib/categories";

/**
 * Section index strip — a quiet row of type beneath a hairline.
 *
 * Items are `shrink-0` and never wrap: as flex children they would otherwise
 * compress into narrow columns of stacked words, which looks broken. When the
 * row is wider than the screen it scrolls sideways instead.
 */
export function CategoryBar() {
  return (
    <section className="hairline-b bg-surface" aria-label="Sections">
      <div className="container-editorial">
        <nav className="flex items-stretch overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 divide-x divide-[var(--line)]">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="category-item shrink-0 whitespace-nowrap first:pl-0 sm:first:pl-5"
            >
              <span className="font-display text-[13px] sm:text-[15px] font-semibold tracking-wide">
                {cat.name}
              </span>
              {/* Descriptions only where there is room for them. */}
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.16em] opacity-70 mt-0.5">
                {cat.description}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
