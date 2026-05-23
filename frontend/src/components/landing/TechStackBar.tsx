const TECH_STACK = [
  "Next.js",
  "TypeScript",
  "Tailwind",
  "FastAPI",
  "PostgreSQL",
  "SQLAlchemy",
  "Alembic",
  "Claude AI",
] as const;

const JOB_DATA_SOURCES = [
  "Adzuna",
  "Arbeitnow",
  "Remotive",
  "Jooble",
] as const;

export default function TechStackBar() {
  return (
    <section className="border-t border-white/[0.08] bg-[#111827] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Under the hood
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TECH_STACK.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/[0.08] bg-[#0B1120] px-3 py-1.5 font-mono text-[11px] text-slate-300 ring-1 ring-inset ring-white/[0.04]"
              >
                {item}
              </span>
            ))}
          </div>

          <span
            className="hidden h-8 w-px bg-white/10 sm:block"
            aria-hidden
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            {JOB_DATA_SOURCES.map((item) => (
              <span
                key={item}
                className="rounded-full border border-blue-400/15 bg-blue-400/[0.06] px-3 py-1.5 font-mono text-[11px] text-blue-200/90 ring-1 ring-inset ring-blue-400/10"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
