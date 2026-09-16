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

/**
 * Masthead — the paper's identity bar. Brand + small-caps section links on
 * a hairline; condenses on scroll so reading never feels crowded.
 */
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

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-[var(--paper)]/90 backdrop-blur-md transition-all duration-500 ease-butter",
          isScrolled ? "shadow-paper" : "hairline-b"
        )}
      >
        <div
          className={cn(
            "container-editorial flex items-center justify-between transition-all duration-500 ease-butter",
            isScrolled ? "h-14" : "h-16 sm:h-[72px]"
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="The EWU Express"
              width={34}
              height={34}
              className="rounded-md transition-transform duration-500 ease-butter group-hover:scale-105"
              priority
            />
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-ink leading-none whitespace-nowrap">
              THE EWU EXPRESS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7" aria-label="Sections">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="masthead-link"
                data-active={pathname === `/category/${cat.slug}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full hover:bg-[var(--raised)] transition-colors text-muted hover:text-ink"
              aria-label="Search"
            >
              <Search size={17} />
            </button>
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-[var(--raised)] transition-colors text-muted hover:text-ink"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hairline-t overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container-editorial py-4">
                <input
                  type="text"
                  placeholder="Search stories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-[var(--raised)] rounded-md text-lg font-display outline-none focus:ring-2 focus:ring-[var(--gold)] text-ink"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile drawer — full-screen, serif links, staggered in */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[var(--paper)] pt-20 md:hidden"
          >
            <div className="container-editorial flex flex-col">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="hairline-b"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className={cn(
                      "flex items-baseline justify-between py-4 font-display text-2xl transition-colors duration-300",
                      pathname === `/category/${cat.slug}`
                        ? "text-[var(--accent)]"
                        : "text-ink"
                    )}
                  >
                    {cat.name}
                    <span className="text-faint text-xs uppercase tracking-widest">
                      0{i + 1}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
