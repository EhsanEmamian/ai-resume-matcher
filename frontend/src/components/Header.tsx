import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white shadow-sm">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">
              AI Resume Matcher
            </p>
            <p className="text-xs text-gray-500">
              Resume parsing, live jobs, explainable matching
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-gray-700 transition hover:bg-gray-100"
          >
            Home
          </Link>
          <Link
            href="/live-jobs"
            className="rounded-xl px-4 py-2 text-gray-700 transition hover:bg-gray-100"
          >
            Live Search
          </Link>
          <Link
            href="/jobs"
            className="rounded-xl px-4 py-2 text-gray-700 transition hover:bg-gray-100"
          >
            Imported Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}