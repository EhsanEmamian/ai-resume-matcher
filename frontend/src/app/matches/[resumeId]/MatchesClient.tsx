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
import { motion } from "framer-motion";
import { use, useEffect, useMemo, useState } from "react";
import AnimatedCircularProgress from "@/components/AnimatedCircularProgress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
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

function matchesFilter(match: MatchItem, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "strong") return match.score >= 0.7;
  if (filter === "moderate") return match.score >= 0.4 && match.score < 0.7;
  return match.score < 0.4;
}

function scorePercent(score: number) {
  return Math.round(score * 100);
}

const matchListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const matchCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const SCORE_BREAKDOWN_MAX = {
  skill: 0.7,
  role: 0.3,
  remote: 0.1,
} as const;

function breakdownFillPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

function formatScorePoints(value: number) {
  return value.toFixed(2);
}

function ScoreBreakdownBar({
  label,
  value,
  max,
  barClass,
  badgeClass,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
  badgeClass: string;
}) {
  const fill = breakdownFillPercent(value, max);

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">Max {formatScorePoints(max)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[11px] ${badgeClass}`}
        >
          {formatScorePoints(value)} / {formatScorePoints(max)}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${fill}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {fill}% of component weight earned
      </p>
    </div>
  );
}

function ScoreBreakdownSection({
  breakdown,
}: {
  breakdown: MatchItem["score_breakdown"];
}) {
  if (!breakdown) {
    return (
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-slate-500" />
          <p className="font-semibold text-slate-200">Score Breakdown</p>
        </div>
        <p className="mt-3 leading-6 text-slate-400">
          Detailed scoring breakdown is not available for this match. Regenerate
          matches to refresh transparent score components.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-slate-400" />
          <p className="font-semibold text-slate-200">Score Breakdown</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-white/10 bg-[#111827] px-2.5 py-1 font-mono text-[11px] text-slate-300">
          Final {scorePercent(breakdown.final_score)}%
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Match score is the sum of skill overlap (up to 0.7), role overlap (up to
        0.3), and remote bonus (up to 0.1), capped at 100%.
      </p>

      <div className="mt-4 grid gap-3">
        <ScoreBreakdownBar
          label="Skill Overlap Score"
          value={breakdown.skill_overlap_score}
          max={SCORE_BREAKDOWN_MAX.skill}
          barClass="bg-blue-400"
          badgeClass="border border-blue-400/20 bg-blue-500/10 text-blue-300"
        />
        <ScoreBreakdownBar
          label="Role Overlap Score"
          value={breakdown.role_overlap_score}
          max={SCORE_BREAKDOWN_MAX.role}
          barClass="bg-violet-400"
          badgeClass="border border-violet-400/20 bg-violet-500/10 text-violet-300"
        />
        <ScoreBreakdownBar
          label="Remote Bonus"
          value={breakdown.remote_bonus}
          max={SCORE_BREAKDOWN_MAX.remote}
          barClass="bg-cyan-400"
          badgeClass="border border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 font-mono text-[11px] text-blue-300">
          Skills +{formatScorePoints(breakdown.skill_overlap_score)}
        </span>
        <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-mono text-[11px] text-violet-300">
          Role +{formatScorePoints(breakdown.role_overlap_score)}
        </span>
        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 font-mono text-[11px] text-cyan-300">
          Remote +{formatScorePoints(breakdown.remote_bonus)}
        </span>
        <span className="inline-flex rounded-full border border-white/10 bg-[#111827] px-2.5 py-1 font-mono text-[11px] text-slate-300">
          = {formatScorePoints(breakdown.final_score)} total
        </span>
      </div>
    </div>
  );
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

export default function MatchesClient({
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
      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-10 w-72" />
            <Skeleton className="mt-4 h-5 w-2/3" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>

          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
      <Footer />
    </>
  );
}

    if (error) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
                    <div className="mx-auto max-w-4xl">
                        <AlertBanner variant="error">{error}</AlertBanner>
                    </div>
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
            <motion.div
              className="space-y-6"
              variants={matchListVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {filteredMatches.map((match) => (
                <motion.article
                  key={match.id}
                  variants={matchCardVariants}
                  className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                >
                  <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
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

                    <div className="flex shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0f172a] px-5 py-5 sm:min-w-[200px]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Match Score
                      </p>
                      <AnimatedCircularProgress
                        score={match.score}
                        size={120}
                        label=""
                      />
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadgeClass(
                          match.score
                        )}`}
                      >
                        {scoreLabel(match.score)}
                      </span>
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

                <ScoreBreakdownSection breakdown={match.score_breakdown} />

                <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                  <p className="mb-2 font-semibold">Job description</p>
                  <p className="leading-7 text-slate-300">
                    {match.job.description}
                  </p>
                </div>
                </motion.article>
              ))}
            </motion.div>
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