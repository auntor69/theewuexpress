"use client";

/**
 * Shimmering placeholder cards shown while the infinite feed fetches.
 * Skeletons read as "content is coming" instead of a spinner's "something is
 * stuck", and they keep layout height stable so the scroll position never jumps.
 */
export function PostCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="bg-surface border border-line rounded-md overflow-hidden">
        <div className="relative aspect-[3/2] bg-[var(--raised)] overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent animate-[shimmer_1.6s_infinite]" />
        </div>
        <div className="p-5">
          <div className="h-2.5 w-16 rounded-full bg-[var(--raised)] mb-3" />
          <div className="h-4 w-11/12 rounded bg-[var(--raised)] mb-2" />
          <div className="h-4 w-2/3 rounded bg-[var(--raised)] mb-3" />
          <div className="h-2.5 w-1/3 rounded-full bg-[var(--raised)]/80" />
        </div>
      </div>
    </div>
  );
}
