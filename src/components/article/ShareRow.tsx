"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Link2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Share actions for a story.
 *
 * Monochrome icon buttons in the same hairline language as the rest of the
 * page — no brand colours, no filled badges. Each icon is the service's own
 * mark (not a generic external-link glyph, which is what made the old row
 * impossible to read) and each one names itself on hover plus in its
 * aria-label, so a reader never has to guess.
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

const ICON_BUTTON =
  "group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-all duration-300 ease-butter hover:border-[var(--ink)] hover:text-ink hover:bg-raised";

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.4rem)] z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink opacity-0 shadow-paper transition-opacity duration-200 group-hover:opacity-100">
      {label}
    </span>
  );
}

/* Brand marks (simple-icons, CC0) drawn with currentColor so they inherit the
   page's ink/muted tones instead of the vendors' colours. */

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

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
      external: true,
      icon: <FacebookIcon />,
    },
    {
      label: "WhatsApp",
      ariaLabel: "Share this story on WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      external: true,
      icon: <WhatsAppIcon />,
    },
    {
      label: "X",
      ariaLabel: "Share this story on X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      external: true,
      icon: <XIcon />,
    },
    {
      label: "Email",
      ariaLabel: "Share this story by email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
        caption ? `${caption}\n\n${url}` : url
      )}`,
      external: false,
      icon: <Mail size={15} />,
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
        {!heading && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint mr-1">
            Share
          </span>
        )}

        {targets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            aria-label={target.ariaLabel}
            {...(target.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={ICON_BUTTON}
          >
            {target.icon}
            <Tooltip label={target.label} />
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy a link to this story"
          className={cn(
            ICON_BUTTON,
            copied && "border-[var(--gold)] text-[var(--gold)]"
          )}
        >
          {copied ? <Check size={15} /> : <Link2 size={15} />}
          <Tooltip label={copied ? "Link copied" : "Copy link"} />
        </button>
      </div>
    </div>
  );
}
