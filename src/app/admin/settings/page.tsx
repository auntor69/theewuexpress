"use client";

import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Mail,
  Send,
  Save,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface SettingsState {
  mailFromName: string;
  mailUser: string;
  hasMailAppPassword: boolean;
  siteUrl: string;
  active: {
    fromName: string;
    user: string;
    siteUrl: string;
    source: "settings" | "env";
  } | null;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<SettingsState | null>(null);
  const [form, setForm] = useState({
    mailFromName: "",
    mailUser: "",
    mailAppPassword: "",
    siteUrl: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SettingsState | null) => {
        if (data) {
          setState(data);
          setForm({
            mailFromName: data.mailFromName || "",
            mailUser: data.mailUser || "",
            mailAppPassword: "",
            siteUrl: data.siteUrl || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success("Settings saved — sending now works from your own Gmail.");
      // Refresh the active-status panel.
      const fresh = await fetch("/api/admin/settings").then((r) => r.json());
      setState(fresh);
      setForm((prev) => ({ ...prev, mailAppPassword: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter the email where the test should go");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Test failed");
      toast.success("Test email sent! Check the inbox (and spam).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const active = state?.active;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black dark:text-white">Settings</h1>
        <p className="text-neutral-500 mt-1">
          Newsletter sending account and site address — saved in your database,
          no server access needed.
        </p>
      </div>

      {/* Live status card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 mb-6 flex items-start gap-3 border ${
          active
            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40"
            : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40"
        }`}
      >
        {active ? (
          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        )}
        <div className="text-sm">
          {active ? (
            <>
              <p className="font-semibold text-green-800 dark:text-green-300">
                Newsletter is live — emails send from {active.fromName} &lt;{active.user}&gt;
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                {active.source === "settings"
                  ? "Using the credentials saved on this page."
                  : "Using environment variables — save settings here to manage it yourself."}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Newsletter is not sending yet
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                Fill in the sender name, your Gmail address and an App Password below,
                then press Save. Subscriptions already work — they&apos;re waiting for this.
              </p>
            </>
          )}
        </div>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-red-500" />
            <h2 className="font-bold text-lg dark:text-white">Newsletter sender (Gmail)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Sender name
              </label>
              <input
                type="text"
                value={form.mailFromName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mailFromName: e.target.value }))
                }
                placeholder="The EWU Express"
                className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Gmail address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.mailUser}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mailUser: e.target.value }))
                }
                placeholder="you@gmail.com"
                className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Gmail App Password{" "}
              {state?.hasMailAppPassword ? (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  (one is saved — leave blank to keep it)
                </span>
              ) : (
                <span className="text-red-500">*</span>
              )}
            </label>
            <div className="relative">
              <KeyRound
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={form.mailAppPassword}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mailAppPassword: e.target.value }))
                }
                placeholder={state?.hasMailAppPassword ? "•••• •••• •••• ••••" : "abcd efgh ijkl mnop"}
                autoComplete="new-password"
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Google account → <strong>Security</strong> → 2-Step Verification →{" "}
              <strong>App passwords</strong> → generate one for “Mail”. It&apos;s a
              16-character code. Stored in your database, never shown again.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <span className="inline-flex items-center gap-1.5">
                <Globe size={13} /> Site URL
              </span>{" "}
              <span className="text-neutral-400 font-normal">(for links inside emails)</span>
            </label>
            <input
              type="url"
              value={form.siteUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, siteUrl: e.target.value }))
              }
              placeholder="https://theewuexpress.com"
              className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      {/* Test email card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Send size={16} className="text-blue-500" />
          <h2 className="font-bold text-lg dark:text-white">Send a test email</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Verifies the Gmail setup instantly before announcing it to subscribers.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="where-to-send@test.com"
            className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-700 text-white font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 flex-shrink-0"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {testing ? "Sending..." : "Send test"}
          </button>
        </div>
      </div>

      <a
        href="https://myaccount.google.com/apppasswords"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-500 transition-colors mt-6"
      >
        <ExternalLink size={13} />
        Open Google App Passwords
      </a>
    </div>
  );
}
