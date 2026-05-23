"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, BriefcaseBusiness, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import MatchResultCard from "@/components/MatchResultCard";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import {
  generateMatches,
  getMatches,
  type MatchItem,
} from "@/lib/api";

type FilterValue = "all" | "strong" | "moderate" | "weak";

function matchesFilter(match: MatchItem, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "strong") return match.score >= 0.7;
  if (filter === "moderate") return match.score >= 0.4 && match.score < 0.7;
  return match.score < 0.4;
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
                <MatchResultCard key={match.id} match={match} />
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