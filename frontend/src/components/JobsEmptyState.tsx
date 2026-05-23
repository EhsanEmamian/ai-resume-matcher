"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Search, ArrowDown } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type SeedResult = {
  created: number;
  skipped: number;
  message: string;
};

type Props = {
  onSeeded: () => void;
};

const DEMO_PREVIEW = [
  { title: "Senior Backend Engineer", meta: "Acme GmbH · Vienna, Austria", tags: ["Python", "FastAPI"], color: "blue" as const },
  { title: "AI Integration Engineer", meta: "TechCorp · Remote", tags: ["LLM", "Claude API"], color: "teal" as const },
  { title: "Python Developer", meta: "StartupXY · Berlin, Germany", tags: ["Django", "PostgreSQL"], color: "violet" as const },
  { title: "Junior Software Engineer", meta: "Wien Digital · Vienna, Austria", tags: ["Java", "REST"], color: "green" as const },
];

const COLOR_MAP = {
  blue: { dot: "bg-blue-400", badge: "border-blue-400/20 bg-blue-500/10 text-blue-300" },
  teal: { dot: "bg-teal-400", badge: "border-teal-400/20 bg-teal-500/10 text-teal-300" },
  violet: { dot: "bg-violet-400", badge: "border-violet-400/20 bg-violet-500/10 text-violet-300" },
  green: { dot: "bg-emerald-400", badge: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" },
};

export default function JobsEmptyState({ onSeeded }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState("");

  async function handleSeedDemo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/seed-demo`, { method: "POST" });
      if (!res.ok) throw new Error("Seed request failed.");
      const data: SeedResult = await res.json();
      setResult(data);
      setTimeout(onSeeded, 1400);
    } catch {
      setError("Could not load demo jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1E2D45] bg-[#111827] px-8 py-14 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center">
        <span className="absolute inline-flex h-[110px] w-[110px] animate-ping rounded-full border border-blue-500/10" />
        <span className="absolute inline-flex h-[90px] w-[90px] animate-ping rounded-full border border-blue-500/15 [animation-delay:600ms]" />
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/6">
          <Database size={28} className="animate-pulse text-blue-400 [animation-duration:3s]" strokeWidth={1.5} />
        </div>
      </div>
      <h2 className="mb-2 text-[17px] font-semibold tracking-tight text-slate-100">No imported jobs yet</h2>
      <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-slate-500">Save jobs from the live search to analyze them here — or load a set of demo jobs to immediately test the matching engine.</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!result ? (
          <button onClick={handleSeedDemo} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563EB] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Loading…</> : <><ArrowDown size={14} strokeWidth={2.5} />Load demo jobs</>}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300">✓ {result.message}</div>
        )}
        <Link href="/live-jobs" className="inline-flex items-center gap-2 rounded-xl border border-[#1E2D45] bg-transparent px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:border-[#2A3F5E] hover:text-slate-200"><Search size={14} />Browse live jobs</Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mx-auto mt-10 max-w-[440px]">
        <p className="mb-3 text-left font-mono text-[10px] uppercase tracking-widest text-[#334155]">Demo jobs preview</p>
        <div className="flex flex-col gap-2">
          {DEMO_PREVIEW.map((job) => {
            const c = COLOR_MAP[job.color];
            return (
              <div key={job.title} className="flex items-center gap-3 rounded-xl border border-[#1B2537] bg-[#0F172A] px-4 py-2.5">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-semibold text-slate-300">{job.title}</p>
                  <p className="font-mono text-[11px] text-slate-500">{job.meta}</p>
                </div>
                <div className="flex gap-1">{job.tags.map((tag) => (<span key={tag} className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${c.badge}`}>{tag}</span>))}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
