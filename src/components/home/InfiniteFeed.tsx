"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { Post } from "@/db/schema";

interface InfiniteFeedProps {
  initialPosts: Post[];
  category?: string;
  search?: string;
}

export function InfiniteFeed({
  initialPosts,
  category,
  search,
}: InfiniteFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 6);
  const [loading, setLoading] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);

  const { ref, inView } = useInView({ threshold: 0 });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    // Only swap to skeletons after a short beat so fast connections never see a flash.
    const skeletonTimer = setTimeout(() => setShowSkeletons(true), 350);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "6",
      });
      if (category) params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      if (data.posts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
        setPage((prev) => prev + 1);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
      setHasMore(false);
    } finally {
      clearTimeout(skeletonTimer);
      setShowSkeletons(false);
      setLoading(false);
    }
  }, [page, loading, hasMore, category, search]);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (inView && !loading) {
      loadMoreRef.current();
    }
  }, [inView, loading]);

  if (!posts.length) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-2xl text-ink">No stories found.</p>
        <p className="text-muted text-sm mt-2">
          Check back soon — new stories drop all the time.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="py-12">
          {loading && showSkeletons && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
