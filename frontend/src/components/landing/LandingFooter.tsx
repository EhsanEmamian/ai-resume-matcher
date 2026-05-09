export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#07111f] px-6 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 py-12 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            AI Resume Matcher
          </p>

          <p className="mt-3 max-w-md text-sm leading-7">
            Intelligent resume analysis, live job discovery, and explainable
            matching — built from scratch as a full-stack AI integration project.
          </p>

          <p className="mt-4 font-mono text-xs text-slate-500">
            Built by Ehsan Emamian
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Product
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <a href="#try-it" className="block hover:text-slate-100">
              Upload Resume →
            </a>
            <a href="/live-jobs" className="block hover:text-slate-100">
              Live Job Search →
            </a>
            <a href="/jobs" className="block hover:text-slate-100">
              Imported Jobs →
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-slate-100"
            >
              API Docs →
            </a>
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Builder
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <a
              href="mailto:emamianehsan@yahoo.com"
              className="block hover:text-slate-100"
            >
              Email →
            </a>
            <a
              href="https://www.linkedin.com/in/ehsan-emamian/"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-slate-100"
            >
              LinkedIn →
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-white/10 py-5 font-mono text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Ehsan Emamian</p>
        <p>FastAPI · PostgreSQL · Claude AI · Next.js · Adzuna · Arbeitnow</p>
      </div>
    </footer>
  );
}