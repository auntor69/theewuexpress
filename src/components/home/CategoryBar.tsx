import Link from "next/link";
import { categories } from "@/lib/categories";

/**
 * Section index strip — a quiet row of type beneath a gold hairline.
 * Hover: ink darkens, a gold rule draws in from the left. Server component,
 * zero JS — the polish is pure CSS.
 */
export function CategoryBar() {
  return (
    <section className="hairline-b" aria-label="Sections">
      <div className="container-editorial">
        <nav className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="category-item">
              <span className="font-display text-[15px] font-semibold tracking-wide">
                {cat.name}
              </span>
              <span className="text-[11px] uppercase tracking-[0.16em] opacity-70 mt-0.5">
                {cat.description}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
