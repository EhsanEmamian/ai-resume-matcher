"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(pathname: string, href: string) {
  const isActive = pathname === href;

  return isActive
    ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition"
    : "rounded-xl px-4 py-2 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white";
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1120]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white text-sm font-bold text-[#0B1120] shadow-sm">
            AI
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              AI Resume Matcher
            </p>
            <p className="hidden text-xs text-white/50 sm:block">
              Resume parsing · Adzuna · Arbeitnow · Remotive · Jooble
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={navClass(pathname, "/")}>
            Home
          </Link>

          <Link href="/live-jobs" className={navClass(pathname, "/live-jobs")}>
            Live Search
          </Link>

          <Link href="/jobs" className={navClass(pathname, "/jobs")}>
            Imported Jobs
          </Link>
        </nav>

        <Link
          href="/#try-it"
          className="rounded-2xl border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/20"
        >
          Upload Resume
        </Link>
      </div>
    </header>
  );
}