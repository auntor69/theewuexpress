"use client";

import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black dark:text-white">New Story</h1>
        <p className="text-neutral-500 mt-1">
          Create a new post for The EWU Express
        </p>
      </div>
      <PostForm mode="create" />
    </div>
  );
}
