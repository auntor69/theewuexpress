"use client";

import { useEffect, useRef } from "react";

/**
 * Thin scroll-progress bar pinned to the very top of article pages.
 * Pure rAF-throttled scroll listener — no animation-library bundle needed,
 * and the transform is GPU-composited so it never triggers layout.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const bar = barRef.current;
      if (!bar) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      // scaleX is composited on the GPU — cheaper than animating width.
      bar.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none"
      aria-hidden
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-[var(--gold)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
