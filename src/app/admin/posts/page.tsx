"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Post } from "@/db/schema";
import { formatViews, timeAgo, cn } from "@/lib/utils";
import { getCategoryBySlug, categories } from "@/lib/categories";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Star,
  Award,
  Search,
  Tag,
  Check,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

type CategoryFilter = "all" | "uncategorized" | string;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const fetchPosts = () => {
    fetch("/api/admin/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (categoryFilter === "uncategorized") {
      result = result.filter((p) => !p.category);
    } else if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q)
      );
    }

    // Uncategorized posts first so they're impossible to miss.
    return [...result].sort((a, b) => {
      if (!a.category && b.category) return -1;
      if (a.category && !b.category) return 1;
      return 0;
    });
  }, [posts, search, categoryFilter]);

  const uncategorizedCount = posts.filter((p) => !p.category).length;

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Post deleted");
      fetchPosts();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleAssignCategory = async (postId: number, category: string) => {
    if (!category) return;
    setAssigningId(postId);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign category");
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, category } : p))
      );
      toast.success(`Category assigned`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign category");
    } finally {
      setAssigningId(null);
    }
  };

  const handleToggle = async (post: Post, field: "published" | "featured" | "editorPick") => {
    const newValue = !post[field];
    const previous = posts;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, [field]: newValue } : p))
    );

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        field === "published"
          ? newValue
            ? "Post published"
            : "Moved to drafts"
          : newValue
          ? "Added"
          : "Removed"
      );
    } catch {
      setPosts(previous);
      toast.error("Failed to update post");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filterOptions: { value: CategoryFilter; label: string; count?: number }[] = [
    { value: "all", label: "All Posts", count: posts.length },
    { value: "uncategorized", label: "Needs Category", count: uncategorizedCount },
    ...categories.map((c) => ({
      value: c.slug,
      label: c.name,
      count: posts.filter((p) => p.category === c.slug).length,
    })),
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black dark:text-white">All Posts</h1>
          <p className="text-neutral-500 mt-1">
            {posts.length} {posts.length === 1 ? "post" : "posts"} total
            {uncategorizedCount > 0 && (
              <span className="text-amber-500 font-medium">
                {" "}
                &middot; {uncategorizedCount} need
                {uncategorizedCount === 1 ? "s" : ""} a category
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity self-start"
        >
          <PlusCircle size={18} />
          New Post
        </Link>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filterOptions.map((opt) => {
            const active = categoryFilter === opt.value;
            const isUncategorized = opt.value === "uncategorized";
            return (
              <button
                key={opt.value}
                onClick={() => setCategoryFilter(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? isUncategorized
                      ? "bg-amber-500 text-white"
                      : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                )}
              >
                {isUncategorized && <Tag size={13} />}
                {opt.label}
                {opt.count !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                      active
                        ? "bg-white/20"
                        : "bg-neutral-200 dark:bg-neutral-700"
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative lg:ml-auto lg:w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    No posts match this filter.
                  </td>
                </tr>
              )}
              {filteredPosts.map((post, i) => {
                const category = getCategoryBySlug(post.category);
                const isAssigning = assigningId === post.id;
                return (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className={cn(
                      "border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      !post.category && "bg-amber-50/60 dark:bg-amber-900/10"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm dark:text-white line-clamp-1 max-w-[300px]">
                          {post.title}
                        </span>
                        <button
                          onClick={() => handleToggle(post, "featured")}
                          title={post.featured ? "Remove from featured" : "Mark as featured"}
                          className="flex-shrink-0"
                        >
                          <Star
                            size={14}
                            className={cn(
                              post.featured
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-neutral-300 dark:text-neutral-600 hover:text-yellow-500"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => handleToggle(post, "editorPick")}
                          title={post.editorPick ? "Remove editor's pick" : "Mark as editor's pick"}
                          className="flex-shrink-0"
                        >
                          <Award
                            size={14}
                            className={cn(
                              post.editorPick
                                ? "text-purple-500"
                                : "text-neutral-300 dark:text-neutral-600 hover:text-purple-500"
                            )}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.category && category ? (
                        <div className="flex items-center gap-1.5 group/cat">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: category.color, backgroundColor: category.softBg }}
                          >
                            {category.name}
                          </span>
                          <button
                            onClick={() => setAssigningId(isAssigning ? null : post.id)}
                            title="Change category"
                            className="p-0.5 text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 opacity-0 group-hover/cat:opacity-100 transition-opacity"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      ) : isAssigning ? (
                        <select
                          autoFocus
                          defaultValue=""
                          onBlur={() => setAssigningId(null)}
                          onChange={(e) => {
                            handleAssignCategory(post.id, e.target.value);
                            setAssigningId(null);
                          }}
                          className="px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                        >
                          <option value="" disabled>
                            Choose…
                          </option>
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setAssigningId(post.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 transition-colors"
                        >
                          <Tag size={11} />
                          Assign category
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(post, "published")}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors",
                          post.published
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                        )}
                      >
                        {post.published && <Check size={10} />}
                        {post.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-500 flex items-center gap-1">
                        <Eye size={12} />
                        {formatViews(post.views)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-500">
                        {timeAgo(post.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/article/${post.slug}`}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="View"
                        >
                          <Eye size={16} className="text-neutral-400" />
                        </Link>
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} className="text-neutral-400" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
