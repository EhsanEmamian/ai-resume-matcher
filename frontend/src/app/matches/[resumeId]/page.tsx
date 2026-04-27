"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
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

function matchesFilter(match: MatchItem, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "strong") return match.score >= 0.7;
  if (filter === "moderate") return match.score >= 0.4 && match.score < 0.7;
  return match.score < 0.4;
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
        <main className="p-8">Loading matches...</main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="p-8 text-red-600">{error}</main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Match Results
              </p>
              <h1 className="mt-2 text-3xl font-bold">Job Matches</h1>
              <p className="mt-2 text-sm text-gray-600">Resume ID: {resumeId}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Filter by match quality
              </p>
              <div className="flex flex-wrap gap-2">
                {(["all", "strong", "moderate", "weak"] as FilterValue[]).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                        filter === value
                          ? "bg-black text-white"
                          : "border border-gray-300 bg-white text-black"
                      }`}
                    >
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.total}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Strong
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.strong}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Moderate
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.moderate}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Weak
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.weak}</p>
            </div>
          </section>

          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredMatches.length}</span> of{" "}
            <span className="font-semibold">{matches.length}</span> matches
          </div>

          {matches.length === 0 ? (
            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[300px] bg-gray-50">
                  <Image
                    src="/images/empty-no-matches.png"
                    alt="No matches illustration"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h2 className="text-xl font-semibold">No matches yet</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    This usually means there are no suitable saved jobs yet, or
                    matching has not produced any results for this resume.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/"
                      className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white"
                    >
                      Import Jobs
                    </Link>
                    <Link
                      href={`/profile/${resumeId}`}
                      className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium"
                    >
                      Back to Profile
                    </Link>
                    <Link
                      href="/jobs"
                      className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold">No matches for this filter</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Try switching back to another filter, such as All or Weak, to see
                more results.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  Show All Matches
                </button>
                <Link
                  href="/jobs"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      <Link href={`/jobs/${match.job.id}`} className="hover:underline">
                        {match.job.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-gray-600">{match.job.company}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {match.job.location || "No location"} •{" "}
                      {match.job.remote ? "Remote" : "On-site"}
                    </p>
                  </div>

                  <div className="min-w-[140px] rounded-2xl bg-black px-4 py-3 text-white">
                    <p className="text-xs uppercase tracking-wide text-gray-300">
                      Match Score
                    </p>
                    <p className="text-2xl font-bold">{match.score}</p>
                    <p className="text-xs text-gray-300">
                      {scoreLabel(match.score)}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold">Why this match?</p>
                  <p className="text-sm text-gray-700">{match.reason}</p>
                </div>

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="mb-2 font-semibold">Matched skills</p>
                    <p className="text-gray-700">
                      {match.matched_skills?.length
                        ? match.matched_skills.join(", ")
                        : "No direct skill match"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="mb-2 font-semibold">Required skills</p>
                    <p className="text-gray-700">
                      {match.job.required_skills.join(", ")}
                    </p>
                  </div>
                </div>

                {match.score_breakdown && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="mb-3 font-semibold">Score breakdown</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <p>
                        <span className="font-medium">Skill overlap:</span>{" "}
                        {match.score_breakdown.skill_overlap_score}
                      </p>
                      <p>
                        <span className="font-medium">Role overlap:</span>{" "}
                        {match.score_breakdown.role_overlap_score}
                      </p>
                      <p>
                        <span className="font-medium">Remote bonus:</span>{" "}
                        {match.score_breakdown.remote_bonus}
                      </p>
                      <p>
                        <span className="font-medium">Final score:</span>{" "}
                        {match.score_breakdown.final_score}
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                  <p className="mb-2 font-semibold">Job description</p>
                  <p className="leading-6 text-gray-700">
                    {match.job.description}
                  </p>
                </div>
              </div>
            ))
          )}

          <div>
            <a
              href={`/profile/${resumeId}`}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              Back to Profile
            </a>
          </div>
        </div>
      </main>
    </>
  );
}