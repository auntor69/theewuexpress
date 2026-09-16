"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/categories";
import { Post } from "@/db/schema";
import toast from "react-hot-toast";
import { Upload, X, Image as ImageIcon, Link2, Send } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { compressImages } from "@/lib/imageCompression";

interface PostFormProps {
  post?: Post;
  mode: "create" | "edit";
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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
    // Empty string = uncategorized; the admin assigns categories from the dashboard.
    category: post?.category || "",
    featured: post?.featured || false,
    editorPick: post?.editorPick || false,
    published: post?.published !== false,
    tags: parseJsonArray(post?.tags),
  });
  // Only meaningful in edit mode for an already-live post: re-send the
  // newsletter to subscribers (create always announces on publish).
  const [notify, setNotify] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    parseJsonArray(post?.images)
  );

  const handleUploadFiles = useCallback(
    async (files: FileList): Promise<string[]> => {
      // Compress in the browser first: a 5 MB phone photo becomes ~300 KB,
      // so imgbb serves a small original and pages render noticeably faster.
      const toUpload = await compressImages(Array.from(files), (done, total, summary) => {
        if (total > 1) {
          toast.loading(`Optimizing ${done}/${total} — ${summary}`, { id: "img-compress", duration: 1500 });
        }
      });

      const formData = new FormData();
      toUpload.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      return data.urls as string[];
    },
    []
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const urls = await handleUploadFiles(files);
      setUploadedImages((prev) => [...prev, ...urls]);

      if (!form.coverImage && urls.length > 0) {
        setForm((prev) => ({ ...prev, coverImage: urls[0] }));
      }

      toast.success("Images uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      // Allow re-selecting the same file.
      e.target.value = "";
    }
  };

  // Used by the editor's "Insert image" button — uploads via the same flow.
  const editorImageUpload = useCallback(async (): Promise<string[]> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/gif,image/webp";
      input.multiple = true;
      input.onchange = async () => {
        if (!input.files?.length) {
          resolve([]);
          return;
        }
        try {
          const urls = await handleUploadFiles(input.files);
          setUploadedImages((prev) => [...prev, ...urls]);
          toast.success("Image inserted!");
          resolve(urls);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
          resolve([]);
        }
      };
      input.oncancel = () => resolve([]);
      input.click();
    });
  }, [handleUploadFiles]);

  const addImageUrl = (raw: string) => {
    const url = raw.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Image URL must start with http:// or https://");
      return;
    }
    setUploadedImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setForm((prev) => ({ ...prev, coverImage: prev.coverImage || url }));
    setLinkInput("");
    toast.success("Image link added!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.caption || !form.content || !form.coverImage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const url = mode === "create" ? "/api/posts" : `/api/posts/${post?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category || null,
          images: uploadedImages,
          notify: mode === "edit" && notify ? true : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save post");
      }

      toast.success(
        mode === "create"
          ? form.published
            ? "Published — subscribers are being notified."
            : "Draft saved."
          : notify
          ? "Updated — newsletter is going out to subscribers."
          : "Post updated!"
      );
      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Title <span className="text-red-500">*</span>
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
              Caption <span className="text-red-500">*</span>
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
              Story <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
              placeholder="Write your story here — format with the toolbar, no HTML needed."
              onImageUpload={editorImageUpload}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-lg dark:text-white">Settings</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Category <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              >
                <option value="">Uncategorized — assign later</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-400 mt-1.5">
                You can assign categories anytime from the dashboard.
              </p>
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

              {mode === "edit" && post?.published && (
                <label className="flex items-start gap-3 cursor-pointer rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-red-500"
                  />
                  <span className="text-sm dark:text-neutral-300">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Send size={13} />
                      Email this to subscribers
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1">
                      Re-sends the newsletter with this story&apos;s link when you save.
                    </span>
                  </span>
                </label>
              )}
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cover Image <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl hover:border-red-500 transition-colors text-neutral-500 hover:text-red-500"
            >
              <Upload size={20} />
              <span className="text-sm font-medium">Upload Images</span>
            </button>
            {/* Paste an image link (e.g. from imgbb) — same behavior as the old system. */}
            <div className="flex gap-2 mt-3">
              <div className="relative flex-1">
                <Link2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addImageUrl(linkInput))
                  }
                  placeholder="Paste an image link (imgbb, https://…)"
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => addImageUrl(linkInput)}
                className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-700 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-600 transition-colors flex-shrink-0"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              Upload a file or paste a link — both are stored in the database and work in production.
            </p>
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {uploadedImages.map((url, i) => (
                  <div
                    key={i}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 group ${
                      form.coverImage === url ? "ring-2 ring-red-500" : ""
                    }`}
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
            {form.coverImage && (
              <div className="mt-3">
                <p className="text-xs text-neutral-400 mb-1.5">Cover preview</p>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-red-500/20"
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
