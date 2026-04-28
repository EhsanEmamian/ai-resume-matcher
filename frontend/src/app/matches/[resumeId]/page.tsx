"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  generateMatches,
  getMatches,
  type MatchItem,
} from "@/lib/api";

type FilterValue = "all" | "strong" | "moderate" | "weak";

function scoreLabel(score: number) {
  if (score >= 0.7) return "Strong Match";
  if (score >= 0.4) return "Moderate Match";
  return "Weak Match";
}

function scoreBadgeClass(score: number) {
  if (score >= 0.7) return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20";
  if (score >= 0.4) return "bg-amber-500/15 text-amber-300 border border-amber-400/20";
  return "bg-slate-500/15 text-slate-300 border border-slate-400/20";
}

function scoreBarClass(score: number) {
  if (score >= 0.7) return "bg-emerald-400";
  if (score >= 0.4) return "bg-amber-400";
  return "bg-slate-400";
}

function matchesFilter(match: MatchItem, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "strong") return match.score >= 0.7;
  if (filter === "moderate") return match.score >= 0.4 && match.score < 0.7;
  return match.score < 0.4;
}

function scorePercent(score: number) {
  return Math.round(score * 100);
}

function SkillChip({
  skill,
  matched = false,
}: {
  skill: string;
  matched?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 font-mono text-[11px] ${
        matched
          ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border border-white/10 bg-[#111827] text-slate-300"
      }`}
    >
      {skill}
    </span>
  );
}

export default function MatchesPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = use(params);

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    async function loadMatches() {
      try {
        await generateMatches(resumeId);
        const result = await getMatches(resumeId);
        setMatches(result.items || []);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [resumeId]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => matchesFilter(match, filter));
  }, [matches, filter]);

  const summary = useMemo(() => {
    const strong = matches.filter((match) => match.score >= 0.7).length;
    const moderate = matches.filter(
      (match) => match.score >= 0.4 && match.score < 0.7
    ).length;
    const weak = matches.filter((match) => match.score < 0.4).length;

    return {
      total: matches.length,
      strong,
      moderate,
      weak,
    };
  }, [matches]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] p-8 text-slate-200">
          Loading matches...
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] p-8 text-red-300">
          {error}
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Match Results
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  Job Matches
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Review ranked saved jobs, compare match quality, and inspect
                  transparent score breakdowns for this resume.
                </p>
                <p className="mt-2 text-xs text-slate-500">Resume ID: {resumeId}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Filter by match quality
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "strong", "moderate", "weak"] as FilterValue[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilter(value)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          filter === value
                            ? "bg-[#3B82F6] text-white"
                            : "border border-white/10 bg-[#111827] text-slate-200"
                        }`}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <BarChart3 size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Total</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{summary.total}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Strong</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{summary.strong}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Target size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Moderate</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{summary.moderate}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <BriefcaseBusiness size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Weak</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{summary.weak}</p>
              </div>
            </div>
          </section>

          <div className="text-sm text-slate-400">
            Showing <span className="font-semibold">{filteredMatches.length}</span> of{" "}
            <span className="font-semibold">{matches.length}</span> matches
          </div>

          {matches.length === 0 ? (
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827] shadow-sm">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[300px] bg-[#0f172a]">
                  <Image
                    src="/images/empty-no-matches.png"
                    alt="No matches illustration"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h2 className="text-xl font-semibold">No matches yet</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    This usually means there are no suitable saved jobs yet, or
                    matching has not produced any results for this resume.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/"
                      className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                    >
                      Import Jobs
                    </Link>
                    <Link
                      href={`/profile/${resumeId}`}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                    >
                      Back to Profile
                    </Link>
                    <Link
                      href="/jobs"
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold">No matches for this filter</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Try switching back to another filter, such as All or Weak, to see
                more results.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                >
                  Show All Matches
                </button>
                <Link
                  href="/jobs"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <article
                key={match.id}
                className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      <Link href={`/jobs/${match.job.id}`} className="hover:underline">
                        {match.job.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <BriefcaseBusiness size={15} />
                        {match.job.company}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={15} />
                        {match.job.location || "No location"}
                      </span>
                      <span>{match.job.remote ? "Remote" : "On-site"}</span>
                    </div>
                  </div>

                  <div className="min-w-[190px] rounded-2xl bg-[#0f172a] px-4 py-4 text-white border border-white/10">
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      Match Score
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="font-mono text-3xl font-bold">
                        {scorePercent(match.score)}%
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadgeClass(
                          match.score
                        )}`}
                      >
                        {scoreLabel(match.score)}
                      </span>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreBarClass(
                          match.score
                        )}`}
                        style={{ width: `${scorePercent(match.score)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4">
                  <p className="mb-2 text-sm font-semibold">Why this match?</p>
                  <p className="text-sm leading-6 text-slate-300">{match.reason}</p>
                </div>

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                    <p className="mb-3 font-semibold">Matched skills</p>
                    {match.matched_skills?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {match.matched_skills.map((skill) => (
                          <SkillChip key={skill} skill={skill} matched />
                        ))}
                      </div>
                    ) : (
                      <p className="leading-6 text-slate-300">No direct skill match</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                    <p className="mb-3 font-semibold">Required skills</p>
                    {match.job.required_skills.length ? (
                      <div className="flex flex-wrap gap-2">
                        {match.job.required_skills.map((skill) => (
                          <SkillChip key={skill} skill={skill} />
                        ))}
                      </div>
                    ) : (
                      <p className="leading-6 text-slate-300">No structured skills listed</p>
                    )}
                  </div>
                </div>

                {match.score_breakdown && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                    <p className="mb-3 font-semibold">Score breakdown</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Skill overlap
                        </p>
                        <p className="mt-2 font-mono text-lg text-slate-200">
                          {scorePercent(match.score_breakdown.skill_overlap_score)}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Role overlap
                        </p>
                        <p className="mt-2 font-mono text-lg text-slate-200">
                          {scorePercent(match.score_breakdown.role_overlap_score)}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Remote bonus
                        </p>
                        <p className="mt-2 font-mono text-lg text-slate-200">
                          {scorePercent(match.score_breakdown.remote_bonus)}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Final score
                        </p>
                        <p className="mt-2 font-mono text-lg text-slate-200">
                          {scorePercent(match.score_breakdown.final_score)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                  <p className="mb-2 font-semibold">Job description</p>
                  <p className="leading-7 text-slate-300">
                    {match.job.description}
                  </p>
                </div>
              </article>
            ))
          )}

          <div>
            <a
              href={`/profile/${resumeId}`}
              className="rounded-2xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-200"
            >
              Back to Profile
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}