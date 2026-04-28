"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function navClass(pathname: string, href: string, scrolled: boolean) {
  const isActive = pathname === href;

  if (!scrolled) {
    return isActive
      ? "rounded-xl bg-[#0B1120] px-4 py-2 text-sm font-medium text-white transition"
      : "rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-black/5 hover:text-black";
  }

  return isActive
    ? "rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition"
    : "rounded-xl px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white";
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "border-b border-white/10 bg-[#0B1120]/92 backdrop-blur"
          : "border-b border-black/5 bg-white/85 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold shadow-sm transition ${
              scrolled ? "bg-white text-black" : "bg-[#0B1120] text-white"
            }`}
          >
            AI
          </div>

          <div>
            <p className={`text-sm font-semibold tracking-tight ${scrolled ? "text-white" : "text-black"}`}>
              AI Resume Matcher
            </p>
            <p className={`text-xs ${scrolled ? "text-white/50" : "text-slate-500"}`}>
              Resume parsing, live jobs, explainable matching
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={navClass(pathname, "/", scrolled)}>
            Home
          </Link>
          <Link href="/live-jobs" className={navClass(pathname, "/live-jobs", scrolled)}>
            Live Search
          </Link>
          <Link href="/jobs" className={navClass(pathname, "/jobs", scrolled)}>
            Imported Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}