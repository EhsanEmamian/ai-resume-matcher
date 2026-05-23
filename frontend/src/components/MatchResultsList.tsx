"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, BriefcaseBusiness, Sparkles, Target } from "lucide-react";
import MatchResultCard from "@/components/MatchResultCard";
import type { MatchItem } from "@/lib/api";

type FilterValue = "all" | "strong" | "moderate" | "weak";

const matchListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

function matchesFilter(match: MatchItem, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "strong") return match.score >= 0.7;
  if (filter === "moderate") return match.score >= 0.4 && match.score < 0.7;
  return match.score < 0.4;
}

type MatchResultsListProps = {
  matches: MatchItem[];
  topBanner?: ReactNode;
};

export default function MatchResultsList({
  matches,
  topBanner,
}: MatchResultsListProps) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filteredMatches = useMemo(
    () => matches.filter((match) => matchesFilter(match, filter)),
    [matches, filter]
  );

  const summary = useMemo(() => {
    const strong = matches.filter((match) => match.score >= 0.7).length;
    const moderate = matches.filter(
      (match) => match.score >= 0.4 && match.score < 0.7
    ).length;
    const weak = matches.filter((match) => match.score < 0.4).length;

    return { total: matches.length, strong, moderate, weak };
  }, [matches]);

  return (
    <div className="space-y-6">
      {topBanner}

      <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Match Results
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">
              Ranked job matches
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Scored against saved jobs in your database using the same engine as
              resume-based matching.
            </p>
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

      <p className="text-sm text-slate-400">
        Showing <span className="font-semibold">{filteredMatches.length}</span> of{" "}
        <span className="font-semibold">{matches.length}</span> matches
      </p>

      {matches.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 text-sm text-slate-400">
          No saved jobs in the database yet. Import jobs first, then run quick match
          again.
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8">
          <h3 className="text-xl font-semibold">No matches for this filter</h3>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-4 rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
          >
            Show All Matches
          </button>
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={matchListVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredMatches.map((match) => (
            <MatchResultCard key={match.id} match={match} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
