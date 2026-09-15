"use client";

/**
 * Shimmering placeholder cards shown while the infinite feed fetches.
 * Skeletons read as "content is coming" instead of a spinner's "something is
 * stuck", and they keep layout height stable so the scroll position never jumps.
 */
export function PostCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="relative aspect-[4/3] rounded-2xl mb-3 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.6s_infinite]" />
      </div>
      <div className="h-3 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800 mb-2" />
      <div className="h-4 w-11/12 rounded-lg bg-neutral-200 dark:bg-neutral-800 mb-1.5" />
      <div className="h-4 w-2/3 rounded-lg bg-neutral-200 dark:bg-neutral-800 mb-2" />
      <div className="h-3 w-1/3 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80" />
    </div>
  );
}
