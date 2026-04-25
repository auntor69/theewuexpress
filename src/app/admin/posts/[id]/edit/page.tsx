"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { Post } from "@/db/schema";

export default function EditPostPage() {
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 text-lg">Post not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black dark:text-white">Edit Story</h1>
        <p className="text-neutral-500 mt-1">Update &quot;{post.title}&quot;</p>
      </div>
      <PostForm post={post} mode="edit" />
    </div>
  );
}
