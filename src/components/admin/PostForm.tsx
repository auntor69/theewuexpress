"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/categories";
import { Post } from "@/db/schema";
import toast from "react-hot-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface PostFormProps {
  post?: Post;
  mode: "create" | "edit";
}

export function PostForm({ post, mode }: PostFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: post?.title || "",
    caption: post?.caption || "",
    content: post?.content || "",
    coverImage: post?.coverImage || "",
    category: post?.category || categories[0].slug,
    featured: post?.featured || false,
    editorPick: post?.editorPick || false,
    published: post?.published !== false,
    tags: post?.tags ? (typeof post.tags === "string" ? JSON.parse(post.tags) : post.tags) : [],
  });
  const [tagInput, setTagInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    post?.images ? (typeof post.images === "string" ? JSON.parse(post.images) : post.images) : []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.caption || !form.content || !form.coverImage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "create" ? "/api/posts" : `/api/posts/${post?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: uploadedImages,
        }),
      });

      if (!res.ok) throw new Error("Failed to save post");

      toast.success(
        mode === "create" ? "Post created!" : "Post updated!"
      );
      router.push("/admin/posts");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadedImages((prev) => [...prev, ...data.urls]);

      if (!form.coverImage && data.urls.length > 0) {
        setForm((prev) => ({ ...prev, coverImage: data.urls[0] }));
      }

      toast.success("Images uploaded!");
    } catch {
      toast.error("Failed to upload images");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t: string) => t !== tag),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter a compelling title..."
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Caption *
            </label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="A short preview that hooks the reader..."
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cover Image URL *
            </label>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, coverImage: e.target.value }))
              }
              placeholder="https://... or upload below"
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            />
            {form.coverImage && (
              <div className="mt-2 relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Content * (HTML supported)
            </label>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Write your story... HTML tags like <p>, <blockquote>, <h3> are supported."
              rows={20}
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-lg dark:text-white">Settings</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      featured: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-red-500"
                />
                <span className="text-sm dark:text-neutral-300">
                  Mark as Featured
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.editorPick}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      editorPick: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-red-500"
                />
                <span className="text-sm dark:text-neutral-300">
                  Editor&apos;s Pick
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      published: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-red-500"
                />
                <span className="text-sm dark:text-neutral-300">Published</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-neutral-900 dark:bg-neutral-700 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg text-xs dark:text-neutral-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-6">
            <h3 className="font-bold text-lg dark:text-white mb-4">
              Upload Images
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl hover:border-red-500 transition-colors text-neutral-500 hover:text-red-500"
            >
              <Upload size={20} />
              <span className="text-sm font-medium">Upload Images</span>
            </button>
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {uploadedImages.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Upload ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImages((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        );
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, coverImage: url }))
                      }
                      className="absolute bottom-1 left-1 p-1 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Set as cover"
                    >
                      <ImageIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : mode === "create"
              ? "Publish Story"
              : "Update Story"}
          </button>
        </div>
      </div>
    </form>
  );
}
