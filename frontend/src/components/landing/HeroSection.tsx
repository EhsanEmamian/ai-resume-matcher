import Link from "next/link";

function SkillBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-slate-300">
      {children}
    </span>
  );
}

function MatchRow({
  company,
  title,
  score,
  tone,
  enriched,
}: {
  company: string;
  title: string;
  score: number;
  tone: "success" | "warning" | "muted";
  enriched?: boolean;
}) {
  const barColor =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-slate-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-100">{title}</p>

            {enriched && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                Enriched · Source extracted
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">{company}</p>
        </div>

        <p className="font-mono text-sm font-semibold text-slate-100">
          {score}%
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-blue-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827] shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0F172A] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>

          <p className="font-mono text-xs text-slate-500">AI Resume Matcher</p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Resume Profile
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B1120] p-4">
              <p className="text-base font-semibold text-slate-100">
                Ehsan Emamian
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Mid-level Backend Engineer
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <SkillBadge>Python</SkillBadge>
                <SkillBadge>FastAPI</SkillBadge>
                <SkillBadge>PostgreSQL</SkillBadge>
                <SkillBadge>Docker</SkillBadge>
                <SkillBadge>REST APIs</SkillBadge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="font-mono text-[11px] text-slate-500">
                    Experience
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-100">
                    3 years
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="font-mono text-[11px] text-slate-500">
                    Focus
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-100">
                    Backend
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Top Matches
              </p>
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 font-mono text-[10px] text-blue-300">
                Explainable scores
              </span>
            </div>

            <div className="space-y-3">
              <MatchRow
                company="TechScale GmbH"
                title="Backend Engineer"
                score={91}
                tone="success"
                enriched
              />
              <MatchRow
                company="CloudWorks AG"
                title="Python Developer"
                score={78}
                tone="warning"
              />
              <MatchRow
                company="DataCraft"
                title="Junior Backend Dev"
                score={64}
                tone="muted"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.25) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.9)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-blue-200">
              AI-Powered · Resume Intelligence
            </span>
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-slate-100 sm:text-5xl lg:text-[4rem] lg:leading-[1.05]">
            Resume intelligence,
            <br />
            built from scratch.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Upload a PDF resume, extract a structured candidate profile with
            Claude AI, and compare it against real job postings using explainable
            score breakdowns.
          </p>

          <p className="mt-5 font-mono text-sm text-slate-500">
            Built by Ehsan Emamian · Backend Engineer · AI Integration
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#try-it"
              className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563EB]"
            >
              Try It Now →
            </Link>

            <Link
              href="/live-jobs"
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              Search Live Jobs ↗
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 font-mono text-[11px] text-slate-500">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              FastAPI
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              PostgreSQL
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Claude AI
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Adzuna
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Arbeitnow
            </span>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}