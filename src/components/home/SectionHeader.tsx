import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders a "View all" link on the right, pointing here. */
  href?: string;
}

/**
 * Editorial section opener: an all-caps label sitting on a hairline rule —
 * the way print papers label their sections. Serif title kept for warmth.
 */
export function SectionHeader({ title, subtitle, href }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <h2 className="kicker whitespace-nowrap">{title}</h2>
        <div className="h-px flex-1 bg-[var(--line)]" aria-hidden />
        {href && (
          <Link
            href={href}
            className="group/link inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-[var(--accent)] transition-colors duration-300 whitespace-nowrap"
          >
            View all
            <ArrowRight
              size={13}
              className="transition-transform duration-300 ease-butter group-hover/link:translate-x-1"
            />
          </Link>
        )}
      </div>
      {subtitle && (
        <p className="text-muted text-sm mt-3 font-display italic">{subtitle}</p>
      )}
    </div>
  );
}
