import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          AI Resume Matcher
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Upload
          </Link>
          <Link
            href="/jobs"
            className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}