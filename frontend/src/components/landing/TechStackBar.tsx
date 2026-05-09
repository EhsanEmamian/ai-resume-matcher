const stack = [
  "Next.js",
  "TypeScript",
  "Tailwind",
  "FastAPI",
  "PostgreSQL",
  "SQLAlchemy",
  "Alembic",
  "Claude AI",
  "Adzuna",
  "Arbeitnow",
];

export default function TechStackBar() {
  return (
    <section className="border-t border-white/10 bg-[#111827] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
        {stack.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-[#0B1120] px-3 py-1.5 font-mono text-[11px] text-slate-400"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}