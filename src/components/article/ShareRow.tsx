"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

/**
 * Share actions for a story.
 *
 * Deliberately labelled, not a row of mystery icons: a strip of identical
 * glyphs leaves readers guessing which one goes where (and two share targets
 * previously rendered the same icon). Plain words remove the guesswork while
 * staying quiet enough for an editorial page — small caps label, hairline
 * capsules, monochrome until hover.
 */
interface ShareRowProps {
  title: string;
  caption?: string;
  /** Absolute URL of the story. */
  url: string;
  /** Optional standalone heading, used for the end-of-story placement. */
  heading?: string;
  className?: string;
}

const CAPSULE =
  "inline-flex items-center rounded-full border border-line px-3 py-1.5 text-[11.5px] font-medium text-muted transition-all duration-300 ease-butter hover:border-[var(--ink)] hover:text-ink hover:bg-raised";

export function ShareRow({
  title,
  caption,
  url,
  heading,
  className,
}: ShareRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error("Couldn't copy automatically — copy it from the address bar.");
    }
  };

  const targets = [
    {
      label: "Facebook",
      ariaLabel: "Share this story on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "WhatsApp",
      ariaLabel: "Share this story on WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      label: "X",
      ariaLabel: "Share this story on X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Email",
      ariaLabel: "Share this story by email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
        caption ? `${caption}\n\n${url}` : url
      )}`,
    },
  ];

  return (
    <div className={className}>
      {heading && (
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink mb-3">
          {heading}
        </h2>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint mr-1">
          Share
        </span>

        {targets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={target.ariaLabel}
            className={CAPSULE}
          >
            {target.label}
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy a link to this story"
          className={cn(
            CAPSULE,
            copied && "border-[var(--gold)] text-[var(--gold)]"
          )}
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
