"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Eye, TrendingUp, BarChart3 } from "lucide-react";
import { formatViews } from "@/lib/utils";
import { getCategoryBySlug } from "@/lib/categories";
import Link from "next/link";

interface Analytics {
  totalPosts: number;
  totalViews: number;
  topPosts: Array<{
    id: number;
    title: string;
    views: number;
    slug: string;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    totalViews: number;
  }>;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black dark:text-white">Dashboard</h1>
        <p className="text-neutral-500 mt-1">
          Overview of your content performance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Posts",
            value: analytics?.totalPosts || 0,
            icon: FileText,
            color: "from-blue-500 to-cyan-500",
          },
          {
            label: "Total Views",
            value: formatViews(analytics?.totalViews || 0),
            icon: Eye,
            color: "from-green-500 to-emerald-500",
          },
          {
            label: "Top Post Views",
            value: formatViews(analytics?.topPosts?.[0]?.views || 0),
            icon: TrendingUp,
            color: "from-red-500 to-orange-500",
          },
          {
            label: "Categories",
            value: analytics?.categoryStats?.length || 0,
            icon: BarChart3,
            color: "from-purple-500 to-pink-500",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-black dark:text-white">
                {stat.value}
              </p>
              <p className="text-neutral-500 text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <h2 className="text-lg font-bold dark:text-white mb-4">
            Top Performing Posts
          </h2>
          <div className="space-y-4">
            {analytics?.topPosts.slice(0, 5).map((post, i) => (
              <div key={post.id} className="flex items-center gap-4">
                <span className="text-2xl font-black text-neutral-300 dark:text-neutral-700 w-8">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/article/${post.slug}`}
                    className="font-medium text-sm dark:text-white hover:text-red-500 transition-colors line-clamp-1"
                  >
                    {post.title}
                  </Link>
                </div>
                <span className="text-sm text-neutral-500 flex items-center gap-1">
                  <Eye size={14} />
                  {formatViews(post.views)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <h2 className="text-lg font-bold dark:text-white mb-4">
            Category Breakdown
          </h2>
          <div className="space-y-4">
            {analytics?.categoryStats.map((stat) => {
              const cat = getCategoryBySlug(stat.category);
              const maxViews = Math.max(
                ...analytics.categoryStats.map((s) => s.totalViews)
              );
              const percentage = maxViews > 0 ? (stat.totalViews / maxViews) * 100 : 0;

              return (
                <div key={stat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium dark:text-white">
                      {cat?.emoji} {cat?.name || stat.category}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {stat.count} posts &middot; {formatViews(stat.totalViews)}{" "}
                      views
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${cat?.color || "from-neutral-400 to-neutral-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
