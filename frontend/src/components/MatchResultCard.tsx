"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, ChevronDown, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCircularProgress from "@/components/AnimatedCircularProgress";
import type { MatchItem } from "@/lib/api";
import {
  normalizeScoreBreakdown,
  SCORE_COMPONENT_LABELS,
} from "@/lib/matchBreakdown";

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

const COMPONENT_KEYS = [
  "skill_overlap",
  "role_alignment",
  "seniority_fit",
  "language_fit",
  "experience_fit",
] as const;

const BAR_COLORS: Record<(typeof COMPONENT_KEYS)[number], string> = {
  skill_overlap: "bg-blue-400",
  role_alignment: "bg-violet-400",
  seniority_fit: "bg-amber-400",
  language_fit: "bg-cyan-400",
  experience_fit: "bg-emerald-400",
};

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

function formatScorePoints(value: number) {
  return value.toFixed(2);
}

const MAX_SKILL_BADGES = 10;

function truncateSkillList(skills: string[]) {
  if (skills.length <= MAX_SKILL_BADGES) {
    return { visible: skills, overflowCount: 0 };
  }

  return {
    visible: skills.slice(0, MAX_SKILL_BADGES),
    overflowCount: skills.length - MAX_SKILL_BADGES,
  };
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
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
}) {
  const fill = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <span className="shrink-0 font-mono text-[11px] text-slate-300">
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

type MatchResultCardProps = {
  match: MatchItem;
};

export default function MatchResultCard({ match }: MatchResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const breakdown = normalizeScoreBreakdown(match.score_breakdown);
  const narrative = breakdown?.narrative?.trim() || match.reason;
  const matchedSkills =
    match.matched_skills?.length
      ? match.matched_skills
      : breakdown?.matched_skills ?? [];
  const requiredSkills = match.job.required_skills ?? [];
  const { visible: visibleRequiredSkills, overflowCount: requiredOverflow } =
    truncateSkillList(requiredSkills);

  return (
    <motion.article
      variants={matchCardVariants}
      className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm transition-all duration-300 hover:border-blue-500/30"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {breakdown?.data_quality === "minimal" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                ⚠ Limited job data
              </span>
            )}
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            <Link href={`/jobs/${match.job.id}`} className="hover:underline">
              {match.job.title}
            </Link>
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness size={15} />
              {match.job.company}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={15} />
              {match.job.location || "No location"}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Matched skills
            </p>
            {matchedSkills.length ? (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill) => (
                  <SkillChip key={skill} skill={skill} matched />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No direct skill overlap</p>
            )}
          </div>

          {requiredSkills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Required skills
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleRequiredSkills.map((skill) => (
                  <SkillChip key={skill} skill={skill} />
                ))}
                {requiredOverflow > 0 && (
                  <span className="inline-flex rounded-full border border-white/10 bg-[#0f172a] px-2.5 py-1 font-mono text-[11px] text-slate-400">
                    + {requiredOverflow} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0f172a] px-5 py-5 sm:min-w-[180px]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Match Score
          </p>
          <AnimatedCircularProgress score={match.score} size={108} label="" />
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadgeClass(
              match.score
            )}`}
          >
            {scoreLabel(match.score)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20"
          aria-expanded={expanded}
        >
          {expanded ? "Hide breakdown" : "View breakdown"}
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
            <p className="mb-2 text-sm font-semibold text-slate-200">
              Why this match?
            </p>
            <p className="text-sm leading-7 text-slate-300">{narrative}</p>
          </div>

          {breakdown ? (
            <>
              <div className="grid gap-3">
                {COMPONENT_KEYS.map((key) => (
                  <ScoreBreakdownBar
                    key={key}
                    label={SCORE_COMPONENT_LABELS[key]}
                    value={breakdown[key]}
                    max={breakdown.weights[key] ?? 0}
                    barClass={BAR_COLORS[key]}
                  />
                ))}
              </div>

              {(breakdown.seniority_signal || breakdown.language_signal) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {breakdown.seniority_signal && (
                    <div className="rounded-xl border border-white/10 bg-[#0f172a] p-3 text-xs text-slate-400">
                      <p className="font-semibold text-slate-300">Seniority</p>
                      <p className="mt-1 leading-5">{breakdown.seniority_signal}</p>
                    </div>
                  )}
                  {breakdown.language_signal && (
                    <div className="rounded-xl border border-white/10 bg-[#0f172a] p-3 text-xs text-slate-400">
                      <p className="font-semibold text-slate-300">Languages</p>
                      <p className="mt-1 leading-5">{breakdown.language_signal}</p>
                    </div>
                  )}
                </div>
              )}

              {breakdown.missing_skills.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-200">
                    Missing skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {breakdown.missing_skills.map((skill) => (
                      <SkillChip key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Regenerate matches to load the detailed five-component breakdown.
            </p>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
            <p className="mb-2 font-semibold">Job description</p>
            <p className="line-clamp-6 leading-7 text-slate-300">
              {match.job.description}
            </p>
          </div>
        </div>
      )}
    </motion.article>
  );
}
