"use client";

import { Post } from "@/db/schema";
import { PostCard } from "@/components/home/PostCard";
import { SectionHeader } from "@/components/home/SectionHeader";

interface RelatedPostsProps {
  posts: Post[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <SectionHeader title="More Stories" accent />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </section>
  );
}
