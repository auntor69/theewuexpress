"use client";

import { useCallback, useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Mail,
  Users,
  Clock,
  Search,
  Download,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Ban,
} from "lucide-react";
import { isConfirmLinkExpired, timeAgo } from "@/lib/utils";

interface Subscriber {
  id: number;
  email: string;
  subscribedAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
}

interface Overview {
  active: number;
  awaiting: number;
  unsubscribed: number;
  pending: number;
  retryable: number;
  pendingStory: { postId: number; title: string; count: number } | null;
  last: {
    title: string;
    sent: number;
    failed: number;
    skipped: number;
    pending: number;
    total: number;
    at: string;
  } | null;
  recentFailures: { email: string; error: string; at: string }[];
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [awaiting, setAwaiting] = useState(0);
  const [unsubscribed, setUnsubscribed] = useState(0);
  /** Pending signups whose confirmation link is past its 7-day window. */
  const [expiredAwaiting, setExpiredAwaiting] = useState(0);
  const [pruning, setPruning] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const [listRes, overviewRes] = await Promise.all([
        fetch("/api/admin/subscribers"),
        fetch("/api/admin/newsletter"),
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        setSubscribers(data?.subscribers || []);
        setTotal(data?.total || 0);
        setActive(data?.active || 0);
        setAwaiting(data?.awaiting || 0);
        setUnsubscribed(data?.unsubscribed || 0);
        setExpiredAwaiting(data?.expiredAwaiting || 0);
      }
      if (overviewRes.ok) {
        setOverview(await overviewRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendRemaining = async (retryFailed = false) => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryFailed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send");

      const s = data.summary;
      toast.success(
        s && s.total
          ? `Sent ${s.sent}${s.failed ? `, ${s.failed} still failing` : ""}${
              s.pending ? `, ${s.pending} left to send` : ""
            }`
          : "Nothing left to send"
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (subscriber: Subscriber) => {
    if (!confirm(`Remove ${subscriber.email} from the mailing list?`)) return;
    try {
      const res = await fetch(`/api/admin/subscribers?id=${subscriber.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSubscribers((prev) => prev.filter((s) => s.id !== subscriber.id));
      setTotal((prev) => prev - 1);
      if (subscriber.unsubscribedAt) setUnsubscribed((prev) => prev - 1);
      else if (subscriber.confirmedAt) setActive((prev) => prev - 1);
      else setAwaiting((prev) => prev - 1);
      toast.success("Subscriber removed");
    } catch {
      toast.error("Failed to delete subscriber");
    }
  };

  /** Removes dead pending signups (never confirmed, link expired). Safe:
      such a row can never become a reader — the link no longer works. */
  const handlePruneExpired = async () => {
    if (
      !confirm(
        `Remove ${expiredAwaiting} signup${expiredAwaiting === 1 ? "" : "s"} that never confirmed within 7 days?`
      )
    )
      return;
    setPruning(true);
    try {
      const res = await fetch("/api/admin/subscribers?pruneExpired=1", {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to prune");
      toast.success(`Removed ${data.removed} expired signup${data.removed === 1 ? "" : "s"}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to prune");
    } finally {
      setPruning(false);
    }
  };

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

  const pending = overview?.pending ?? 0;
  const retryable = overview?.retryable ?? 0;
  const needsAttention = pending > 0 || retryable > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black dark:text-white">Subscribers</h1>
        <p className="text-neutral-500 mt-1">
          Only readers who confirmed their address get an email when a new story
          is published
        </p>
      </div>

      {/* Delivery status — the queue never disappears silently */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {needsAttention ? (
              <AlertTriangle
                size={20}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
            ) : (
              <CheckCircle2
                size={20}
                className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
              />
            )}
            <div className="text-sm">
              {needsAttention ? (
                <>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    {pending > 0
                      ? `${pending} email${pending === 1 ? "" : "s"} still waiting to send`
                      : `${retryable} email${retryable === 1 ? "" : "s"} failed to send`}
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {pending > 0 ? (
                      <>
                        From{" "}
                        <span className="font-medium">
                          {overview?.pendingStory?.title ?? "a recent story"}
                        </span>
                        . Nothing was lost — send them now.
                      </>
                    ) : (
                      "Usually a Gmail sending limit or a temporary connection error. Retrying is safe: nobody receives the same story twice."
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    All caught up
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {overview?.last
                      ? `Last story sent ${timeAgo(overview.last.at)}: ${overview.last.sent} delivered${
                          overview.last.failed
                            ? `, ${overview.last.failed} failed`
                            : ""
                        }${overview.last.skipped ? `, ${overview.last.skipped} skipped` : ""}.`
                      : "No newsletter has gone out yet."}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pending > 0 && (
              <button
                onClick={() => handleSendRemaining(false)}
                disabled={sending}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {sending ? "Sending..." : "Send remaining now"}
              </button>
            )}
            {retryable > 0 && (
              <button
                onClick={() => handleSendRemaining(true)}
                disabled={sending}
                className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
              >
                <Clock size={15} />
                Retry {retryable} failed
              </button>
            )}
          </div>
        </div>

        {overview?.recentFailures?.length ? (
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Recent failures
            </p>
            <ul className="space-y-1">
              {overview.recentFailures.map((failure, i) => (
                <li key={i} className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {failure.email}
                  </span>{" "}
                  — {failure.error}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white mb-4">
            <Users size={18} />
          </div>
          <p className="text-3xl font-black dark:text-white">{total}</p>
          <p className="text-neutral-500 text-sm">Total sign-ups</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white mb-4">
            <Mail size={18} />
          </div>
          <p className="text-3xl font-black dark:text-white">{active}</p>
          <p className="text-neutral-500 text-sm">Receiving emails</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <Clock size={18} />
          </div>
          <p className="text-3xl font-black dark:text-white">{awaiting}</p>
          <p className="text-neutral-500 text-sm">Awaiting confirmation</p>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            Signed up but never clicked the link in the confirmation email. They
            are not emailed until they do — that click is the record of consent.
          </p>
          {expiredAwaiting > 0 && (
            <div className="mt-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                  {expiredAwaiting} link{expiredAwaiting === 1 ? "" : "s"} expired
                </span>{" "}
                (older than 7 days) — they can no longer confirm and will never
                be emailed.
              </p>
              <button
                onClick={handlePruneExpired}
                disabled={pruning}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 transition-colors disabled:opacity-50"
              >
                {pruning ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {pruning ? "Removing..." : "Clear expired"}
              </button>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 mb-4">
            <Ban size={18} />
          </div>
          <p className="text-3xl font-black dark:text-white">{unsubscribed}</p>
          <p className="text-neutral-500 text-sm">Unsubscribed</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] lg:max-w-xs">
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
        <a
          href="/api/admin/subscribers/export"
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-200 transition-colors"
        >
          <Download size={15} />
          Export CSV
        </a>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-400">
            {search
              ? "No subscribers match your search."
              : "No subscribers yet — they'll show up here as soon as someone signs up."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-4" />
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
                        <Mail size={13} className="text-neutral-400 flex-shrink-0" />
                        {sub.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.unsubscribedAt ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          Unsubscribed
                        </span>
                      ) : !sub.confirmedAt ? (
                        isConfirmLinkExpired(sub.subscribedAt) ? (
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                            title="Never confirmed within 7 days — can no longer be confirmed and will never be emailed"
                          >
                            Expired
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            Awaiting confirmation
                          </span>
                        )
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-500 flex items-center gap-1">
                        <Clock size={12} />
                        {timeAgo(sub.subscribedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(sub)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label={`Remove ${sub.email}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
