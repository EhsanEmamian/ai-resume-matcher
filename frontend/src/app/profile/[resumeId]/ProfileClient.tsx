"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, FileText, Languages, Sparkles, Wrench } from "lucide-react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import { Skeleton } from "@/components/Skeleton";
import {
  generateMatches,
  getJobs,
  getResumeFull,
  type ResumeFullResponse,
} from "@/lib/api";
import { deriveSearchSuggestions } from "@/lib/profileSearchSuggestions";

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
    <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="text-slate-400">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-6 text-slate-300">{value || "-"}</p>
    </div>
  );
}

export default function ProfileClient({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = use(params);

  const [data, setData] = useState<ResumeFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [importedJobsCount, setImportedJobsCount] = useState(0);

  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    async function fetchResumeAndMaybeGenerate() {
      try {
        const jobsResult = await getJobs(0, 1);
        const totalJobs = jobsResult.total || 0;
        setImportedJobsCount(totalJobs);

        let result = await getResumeFull(resumeId);

        const hasStoredMatches = (result.matches?.length || 0) > 0;

        if (!hasStoredMatches && totalJobs > 0) {
          setIsGeneratingMatches(true);
          await generateMatches(resumeId);
          result = await getResumeFull(resumeId);
          setIsGeneratingMatches(false);
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
        setIsGeneratingMatches(false);
      }
    }

    fetchResumeAndMaybeGenerate();
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

  const searchSuggestions = useMemo(() => {
    return deriveSearchSuggestions(data?.profile);
  }, [data?.profile]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-10 w-80" />
              <Skeleton className="mt-4 h-5 w-2/3" />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <Skeleton className="h-64 w-full" />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <Skeleton className="h-40 w-full" />
            </div>
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

  if (!data) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] p-8 text-slate-200">
          No data found.
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Resume Profile
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  {data.filename}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Review the extracted candidate profile, inspect the raw resume
                  text, and move into saved match results when ready.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Resume ID: {data.id}
                </p>
              </div>

              <div className="rounded-2xl bg-[#3B82F6] px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-white/70">
                  Current Matches
                </p>
                <p className="mt-1 text-3xl font-bold">{matchSummary.total}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <BarChart3 size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Total
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.total}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Strong
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.strong}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <BarChart3 size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Moderate
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold">
                  {matchSummary.moderate}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText size={16} />
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Weak
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold">{matchSummary.weak}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827] shadow-sm">
            <div className="grid lg:grid-cols-[1fr_0.9fr]">
              <div className="p-8">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Parsed profile overview
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
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
                  <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
                    <p className="mb-1 text-sm font-semibold text-slate-200">
                      Seniority
                    </p>
                    <p className="text-sm text-slate-300">
                      {data.profile?.seniority_level || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
                    <p className="mb-1 text-sm font-semibold text-slate-200">
                      Years of experience
                    </p>
                    <p className="text-sm text-slate-300">
                      {data.profile?.years_of_experience ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[320px] border-t border-white/10 bg-[#0f172a] lg:border-l lg:border-t-0">
                <Image
                  src="/images/profile-analysis-visual.png"
                  alt="Profile analysis illustration"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {searchSuggestions.length > 0 && (
            <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold">
                Find latest jobs based on this profile
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Based on the extracted profile, try one of these live job searches.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {searchSuggestions.map((suggestion) => (
                  <Link
                    key={suggestion.keyword}
                    href={`/live-jobs?keyword=${encodeURIComponent(
                      suggestion.keyword
                    )}&country=de&location=`}
                    className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                  >
                    {suggestion.label}
                  </Link>
                ))}

                <Link
                  href="/live-jobs"
                  className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                >
                  Search with custom keyword
                </Link>
              </div>
            </section>
          )}

          {isGeneratingMatches ? (
            <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold">
                Finding your best job matches...
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Your profile has been parsed successfully. The system is now
                scoring it against imported jobs.
              </p>
            </section>
          ) : matchSummary.total === 0 && importedJobsCount === 0 ? (
            <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold">
                No jobs to match against yet
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Import jobs from Adzuna to see how your profile scores against real
                postings.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/live-jobs"
                  className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                >
                  Search Adzuna Jobs
                </Link>
                <Link
                  href="/#upload"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Upload Another Resume
                </Link>
              </div>
            </section>
          ) : matchSummary.total === 0 ? (
            <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold">
                Matches generated — but the fit is low for current job listings
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Try importing jobs with different keywords, or review the matches
                page to inspect low-score results.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/matches/${data.id}`}
                  className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                >
                  View Matches
                </Link>
                <Link
                  href="/live-jobs"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Search More Jobs
                </Link>
              </div>
            </section>
          ) : (
            <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold">Ready to review matches</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                This resume already has stored match results. Open the matches page
                to review ranked jobs and score breakdowns.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/matches/${data.id}`}
                  className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                >
                  View Matches
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Browse Jobs
                </Link>
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">
              Extracted Resume Text
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Raw text extracted from the uploaded PDF. Useful for debugging parser
              quality and understanding what the system actually received.
            </p>

            <div className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-[#0f172a] p-5 text-sm leading-7 text-slate-300">
              {data.raw_text || "No raw text available."}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/matches/${data.id}`}
              className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white"
            >
              View Matches
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200"
            >
              Back Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}