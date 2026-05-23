"use client";

import Link from "next/link";
import type { HeroState } from "@/lib/heroState";

function SkillBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-slate-300 ring-1 ring-inset ring-white/[0.04]">
      {children}
    </span>
  );
}

type HeroReturningProps = {
  state: Exclude<HeroState, { type: "none" }>;
  onStartFresh: () => void;
};

export default function HeroReturning({ state, onStartFresh }: HeroReturningProps) {
  const isParsedResume = state.type === "parsed_resume";
  const matchesHref = isParsedResume
    ? `/matches/${state.resumeId}`
    : "/quick-match";

  const headline = isParsedResume
    ? "Welcome back — your profile is ready."
    : "Welcome back — your quick match is saved.";

  const subline = isParsedResume
    ? "We parsed your resume, discovered live jobs, and scored your best fits."
    : "Your manual profile preview is ready whenever you want to pick up where you left off.";

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

      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-200">
              {isParsedResume ? "Returning visitor" : "Quick Try saved"}
            </span>
          </div>

          <h1 className="mt-7 max-w-3xl text-balance text-4xl font-bold tracking-[-0.04em] text-slate-50 sm:text-5xl lg:text-[4rem] lg:leading-[1.05]">
            {headline}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300/90 sm:text-lg">
            {subline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={matchesHref}
              className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563EB]"
            >
              View My Matches →
            </Link>

            <button
              type="button"
              onClick={onStartFresh}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              Start fresh
            </button>
          </div>

          <p className="mt-6 font-mono text-xs text-slate-500">
            Saved on this device for up to 7 days · No account required
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-6 rounded-[2rem] bg-emerald-500/10 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#111827] p-8 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/[0.06]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Your last session
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#0F172A] p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-blue-300">
                Top role
              </p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-50">
                {state.topRole}
              </p>

              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Top skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.topSkills.length > 0 ? (
                  state.topSkills.map((skill) => (
                    <SkillBadge key={skill}>{skill}</SkillBadge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills stored yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#0B1120] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Matches found
                </p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.02em] text-emerald-400">
                  {state.matchCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B1120] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Mode
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                  {isParsedResume ? "Resume upload" : "Quick Try"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
