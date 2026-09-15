"use client";

import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { Mail, Users, Clock, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface Subscriber {
  id: number;
  email: string;
  subscribedAt: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setSubscribers(data?.subscribers || []);
        setTotal(data?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? subscribers.filter((s) =>
        s.email.toLowerCase().includes(search.trim().toLowerCase())
      )
    : subscribers;

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
        <h1 className="text-3xl font-black dark:text-white">Subscribers</h1>
        <p className="text-neutral-500 mt-1">
          Everyone who gets an email when a new story is published
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white mb-4">
            <Users size={18} />
          </div>
          <p className="text-3xl font-black dark:text-white">{total}</p>
          <p className="text-neutral-500 text-sm">Total subscribers</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-4">
            <Mail size={18} />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Emails are sent automatically from{" "}
            <span className="font-semibold text-neutral-700 dark:text-neutral-200">
              The EWU Express
            </span>{" "}
            whenever a post goes live — a short preview with a direct link.
          </p>
        </div>
      </div>

      <div className="relative mb-4 lg:w-72">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emails..."
          className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-400">
            {search
              ? "No subscribers match your search."
              : "No subscribers yet — they'll show up here as soon as someone signs up."}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => (
                <motion.tr
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                      <Mail size={13} className="text-neutral-400" />
                      {sub.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-500 flex items-center gap-1">
                      <Clock size={12} />
                      {timeAgo(sub.subscribedAt)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
