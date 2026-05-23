"use client";

import Link from "next/link";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCircularProgress from "@/components/AnimatedCircularProgress";
import type { MatchItem } from "@/lib/api";

export const matchCardVariants = {
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

function scoreLabel(score: number) {
  if (score >= 0.7) return "Strong Match";
  if (score >= 0.4) return "Moderate Match";
  return "Weak Match";
}

function scoreBadgeClass(score: number) {
  if (score >= 0.7) {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20";
  }
  if (score >= 0.4) {
    return "bg-amber-500/15 text-amber-300 border border-amber-400/20";
  }
  return "bg-slate-500/15 text-slate-300 border border-slate-400/20";
}

function breakdownFillPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

function formatScorePoints(value: number) {
  return value.toFixed(2);
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
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm text-slate-400">
        Detailed scoring breakdown is not available for this match.
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-slate-200">Score Breakdown</p>
        <span className="inline-flex w-fit rounded-full border border-white/10 bg-[#111827] px-2.5 py-1 font-mono text-[11px] text-slate-300">
          Final {scorePercent(breakdown.final_score)}%
        </span>
      </div>

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
    </div>
  );
}

type MatchResultCardProps = {
  match: MatchItem;
};

export default function MatchResultCard({ match }: MatchResultCardProps) {
  return (
    <motion.article
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
          <AnimatedCircularProgress score={match.score} size={120} label="" />
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
        <p className="line-clamp-6 leading-7 text-slate-300">{match.job.description}</p>
      </div>
    </motion.article>
  );
}
