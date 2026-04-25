"use client";

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

          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredMatches.length}</span> of{" "}
            <span className="font-semibold">{matches.length}</span> matches
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              No matches found for this filter.
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{match.job.title}</h2>
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