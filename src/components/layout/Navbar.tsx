"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, m as motion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/categories";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setIsScrolled(window.scrollY > 24);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl transition-all duration-300",
          isScrolled
            ? "h-14 shadow-sm border-b border-neutral-200 dark:border-neutral-800"
            : "h-16 border-b border-transparent"
        )}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="EWU Express"
                width={36}
                height={36}
                className="rounded-lg group-hover:scale-105 transition-transform"
                priority
              />
              <span className="font-display font-semibold text-base sm:text-lg tracking-tight dark:text-white leading-none">
                THE EWU EXPRESS
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {categories.map((cat) => {
                const active = pathname === `/category/${cat.slug}`;
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className={cn(
                      "relative px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    )}
                  >
                    {cat.name}
                    <span
                      className={cn(
                        "absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-transform duration-200 origin-left",
                        active ? "scale-x-100" : "scale-x-0"
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Search"
              >
                <Search size={18} className="dark:text-white" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X size={18} className="dark:text-white" />
                ) : (
                  <Menu size={18} className="dark:text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden"
            >
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto p-4">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-lg outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white dark:bg-neutral-950 pt-20"
          >
            <div className="flex flex-col items-center gap-1 p-8">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="w-full text-center"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className={cn(
                      "block py-3 text-2xl font-display transition-colors",
                      pathname === `/category/${cat.slug}`
                        ? "text-red-500"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    )}
                  >
                    {cat.name}
                  </Link>
                  {i < categories.length - 1 && (
                    <div className="h-px w-16 mx-auto bg-neutral-200 dark:bg-neutral-800" />
                    )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
