"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  LogOut,
  ArrowLeft,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "All Posts", icon: FileText },
  { href: "/admin/posts/new", label: "New Post", icon: PlusCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  // Live answer to "where is my data stored?" — reported by the server, not hardcoded.
  const [dbInfo, setDbInfo] = useState<{
    databaseLabel: string;
    isRemote: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/db-info")
      .then((res) => (res.ok ? res.json() : null))
      .then(setDbInfo)
      .catch(() => setDbInfo(null));
  }, []);

  return (
    <aside className="w-64 bg-neutral-950 text-white min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Image src="/logo.png" alt="EWU Express" width={32} height={32} className="rounded-lg" />
          <span className="font-black text-sm tracking-tight">EWU EXPRESS</span>
        </div>
        <p className="text-neutral-500 text-xs">Admin Dashboard</p>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                pathname.startsWith(item.href + "/") &&
                !navItems.some((other) => other.href !== item.href && other.href.length > item.href.length && pathname.startsWith(other.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
          View Site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-all w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        {dbInfo && (
          <div
            className="mt-3 flex items-start gap-2.5 rounded-xl bg-white/5 px-3 py-3"
            title={
              dbInfo.isRemote
                ? "All posts and images are stored in your Turso cloud database"
                : "Heads up: this environment is not connected to Turso — data lives in a local SQLite file"
            }
          >
            <Database
              size={16}
              className={cn(
                "mt-0.5 flex-shrink-0",
                dbInfo.isRemote ? "text-green-400" : "text-amber-400"
              )}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight text-neutral-200">
                {dbInfo.databaseLabel}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-neutral-500">
                {dbInfo.isRemote
                  ? "All posts are stored here"
                  : "Connect Turso to keep data safe"}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
