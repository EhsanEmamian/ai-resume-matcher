"use client";

import { use, useEffect, useState } from "react";

type MatchItem = {
  id: string;
  score: number;
  reason: string;
  score_breakdown: {
    skill_overlap_score: number;
    role_overlap_score: number;
    remote_bonus: number;
    final_score: number;
  } | null;
  matched_skills: string[] | null;
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    required_skills: string[];
    location: string | null;
    remote: boolean;
  };
};

const API_BASE_URL = "http://localhost:8000";

export default function MatchesPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = use(params);

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatches() {
      try {
        await fetch(`${API_BASE_URL}/matches/${resumeId}`, {
          method: "POST",
        });

        const response = await fetch(
          `${API_BASE_URL}/matches/${resumeId}?min_score=0&sort_by=score`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "Failed to load matches.");
        }

        setMatches(result.items || []);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [resumeId]);

  if (loading) {
    return <main className="p-8">Loading matches...</main>;
  }

  if (error) {
    return <main className="p-8 text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
            Match Results
          </p>
          <h1 className="mt-2 text-3xl font-bold">Job Matches</h1>
          <p className="mt-2 text-sm text-gray-600">
            Resume ID: {resumeId}
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            No matches found.
          </div>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{match.job.title}</h2>
                  <p className="text-sm text-gray-600">{match.job.company}</p>
                </div>
                <div className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white">
                  Score: {match.score}
                </div>
              </div>

              <p className="mb-3 text-sm text-gray-700">{match.reason}</p>

              <div className="mb-3 text-sm text-gray-800">
                <p>
                  <span className="font-semibold">Matched skills:</span>{" "}
                  {match.matched_skills?.join(", ") || "-"}
                </p>
                <p>
                  <span className="font-semibold">Required skills:</span>{" "}
                  {match.job.required_skills.join(", ")}
                </p>
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {match.job.location || "-"}
                </p>
                <p>
                  <span className="font-semibold">Remote:</span>{" "}
                  {match.job.remote ? "Yes" : "No"}
                </p>
              </div>

              {match.score_breakdown && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                  <p className="font-semibold">Score breakdown</p>
                  <p>Skill overlap: {match.score_breakdown.skill_overlap_score}</p>
                  <p>Role overlap: {match.score_breakdown.role_overlap_score}</p>
                  <p>Remote bonus: {match.score_breakdown.remote_bonus}</p>
                  <p>Final score: {match.score_breakdown.final_score}</p>
                </div>
              )}
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
  );
}