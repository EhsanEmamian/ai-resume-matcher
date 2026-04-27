"use client";

import Image from "next/image";
import { BarChart3, FileText, Languages, Sparkles, Wrench } from "lucide-react";
import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { getResumeFull, type ResumeFullResponse } from "@/lib/api";

function InfoBlock({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="text-gray-500">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-6 text-gray-700">{value || "-"}</p>
    </div>
  );
}

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

      <main className="min-h-screen bg-[linear-gradient(to_bottom,#ffffff,#f8f8f8)] px-6 py-12 text-black">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                  Resume Profile
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  {data.filename}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                  Review the extracted candidate profile, inspect the raw resume
                  text, and move into saved match results when ready.
                </p>
                <p className="mt-2 text-xs text-gray-500">Resume ID: {data.id}</p>
              </div>

              <div className="rounded-2xl bg-black px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-gray-300">
                  Current Matches
                </p>
                <p className="mt-1 text-3xl font-bold">{matchSummary.total}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-gray-500">
                  <BarChart3 size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Total</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.total}</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-gray-500">
                  <Sparkles size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Strong</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.strong}</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-gray-500">
                  <BarChart3 size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Moderate</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.moderate}</p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-gray-500">
                  <FileText size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">Weak</p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.weak}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_0.9fr]">
              <div className="p-8">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Parsed profile overview
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                  Structured fields extracted from the uploaded resume, ready to be
                  used for job matching and profile review.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoBlock
                    title="Skills"
                    value={data.profile?.skills?.join(", ") || "-"}
                    icon={<Sparkles size={16} />}
                  />
                  <InfoBlock
                    title="Technologies"
                    value={data.profile?.technologies?.join(", ") || "-"}
                    icon={<Wrench size={16} />}
                  />
                  <InfoBlock
                    title="Languages"
                    value={data.profile?.languages?.join(", ") || "-"}
                    icon={<Languages size={16} />}
                  />
                  <InfoBlock
                    title="Suggested roles"
                    value={data.profile?.suggested_roles?.join(", ") || "-"}
                    icon={<FileText size={16} />}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/5 bg-gray-50 p-4">
                    <p className="mb-1 text-sm font-semibold">Seniority</p>
                    <p className="text-sm text-gray-700">
                      {data.profile?.seniority_level || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-gray-50 p-4">
                    <p className="mb-1 text-sm font-semibold">Years of experience</p>
                    <p className="text-sm text-gray-700">
                      {data.profile?.years_of_experience ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[320px] border-t border-black/5 bg-gray-50 lg:border-l lg:border-t-0">
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
            <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold">No matches yet</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Import jobs first, then open the matches page to generate ranked
                results for this resume.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/"
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  Import Jobs
                </a>
                <a
                  href={`/matches/${data.id}`}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Try Matches Anyway
                </a>
                <a
                  href="/#upload"
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Upload Another Resume
                </a>
              </div>
            </section>
          ) : (
            <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold">Ready to review matches</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                This resume already has stored match results. Open the matches page
                to review ranked jobs and score breakdowns.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`/matches/${data.id}`}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  View Matches
                </a>
                <a
                  href="/jobs"
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Browse Jobs
                </a>
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Extracted Resume Text</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Raw text extracted from the uploaded PDF. Useful for debugging parser
              quality and understanding what the system actually received.
            </p>

            <div className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-black/5 bg-gray-50 p-5 text-sm leading-7 text-gray-700">
              {data.raw_text || "No raw text available."}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/matches/${data.id}`}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              View Matches
            </a>
            <a
              href="/"
              className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-medium"
            >
              Back Home
            </a>
          </div>
        </div>
      </main>
    </>
  );
}