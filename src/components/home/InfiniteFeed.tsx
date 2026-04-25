"use client";

import { useState, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { PostCard } from "./PostCard";
import { Post } from "@/db/schema";
import { motion } from "framer-motion";

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
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const { ref, inView } = useInView({ threshold: 0 });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, category, search]);

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  if (!posts.length) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 text-lg">No stories found.</p>
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
        <div ref={ref} className="flex justify-center py-12">
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-red-500 rounded-full"
            />
          )}
        </div>
      )}
    </div>
  );
}
