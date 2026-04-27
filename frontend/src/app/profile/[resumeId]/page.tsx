"use client";

import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { getResumeFull, type ResumeFullResponse } from "@/lib/api";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = use(params);

  const [data, setData] = useState<ResumeFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResume() {
      try {
        const result = await getResumeFull(resumeId);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchResume();
  }, [resumeId]);

  const matchSummary = useMemo(() => {
    if (!data) {
      return { total: 0, strong: 0, moderate: 0, weak: 0 };
    }

    const strong = data.matches.filter((match) => match.score >= 0.7).length;
    const moderate = data.matches.filter(
      (match) => match.score >= 0.4 && match.score < 0.7
    ).length;
    const weak = data.matches.filter((match) => match.score < 0.4).length;

    return {
      total: data.matches.length,
      strong,
      moderate,
      weak,
    };
  }, [data]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="p-8">Loading profile...</main>
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

  if (!data) {
    return (
      <>
        <Header />
        <main className="p-8">No data found.</main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Resume Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold">{data.filename}</h1>
              <p className="mt-2 text-sm text-gray-600">Resume ID: {data.id}</p>
            </div>

            <div className="rounded-2xl bg-black px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-wide text-gray-300">
                Current Matches
              </p>
              <p className="text-2xl font-bold">{matchSummary.total}</p>
            </div>
          </div>

          <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_0.9fr]">
              <div className="p-8">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Parsed profile overview
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                  Review the extracted candidate profile before checking saved matches.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Total
                    </p>
                    <p className="mt-2 text-3xl font-bold">{matchSummary.total}</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Strong
                    </p>
                    <p className="mt-2 text-3xl font-bold">{matchSummary.strong}</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Moderate
                    </p>
                    <p className="mt-2 text-3xl font-bold">{matchSummary.moderate}</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Weak
                    </p>
                    <p className="mt-2 text-3xl font-bold">{matchSummary.weak}</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[300px] border-t border-black/5 bg-gray-50 lg:border-l lg:border-t-0">
                <Image
                  src="/images/profile-analysis-visual.png"
                  alt="Profile analysis illustration"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {matchSummary.total === 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold">No matches yet</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Import jobs first, then open the matches page to generate ranked
                results for this resume.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/#upload"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Upload Another Resume
                </a>
                <a
                  href="/"
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  Import Jobs
                </a>
                <a
                  href={`/matches/${data.id}`}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Try Matches Anyway
                </a>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Ready to review matches</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                This resume already has stored match results. Open the matches page
                to review ranked jobs and score breakdowns.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`/matches/${data.id}`}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  View Matches
                </a>
                <a
                  href="/jobs"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Browse Jobs
                </a>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Parsed Profile</h2>

              <div className="space-y-4 text-sm text-gray-800">
                <div>
                  <p className="mb-1 font-semibold">Skills</p>
                  <p>{data.profile?.skills?.join(", ") || "-"}</p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Technologies</p>
                  <p>{data.profile?.technologies?.join(", ") || "-"}</p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Languages</p>
                  <p>{data.profile?.languages?.join(", ") || "-"}</p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Suggested roles</p>
                  <p>{data.profile?.suggested_roles?.join(", ") || "-"}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-semibold">Seniority</p>
                    <p>{data.profile?.seniority_level || "-"}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-semibold">Years of experience</p>
                    <p>{data.profile?.years_of_experience ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Extracted Resume Text</h2>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
                {data.raw_text || "No raw text available."}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={`/matches/${data.id}`}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
            >
              View Matches
            </a>
            <a
              href="/"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              Upload Another Resume
            </a>
          </div>
        </div>
      </main>
    </>
  );
}