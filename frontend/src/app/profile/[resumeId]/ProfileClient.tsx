"use client";

import Link from "next/link";
import { BarChart3, FileText, Languages, Sparkles, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { use, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import SkillsConstellation from "@/components/SkillsConstellation";
import { Skeleton } from "@/components/Skeleton";
import { buildProfileHints } from "@/lib/profileHints";
import { useCountUp } from "@/lib/useCountUp";
import {
  generateMatches,
  getJobs,
  getResumeFull,
  type ResumeFullResponse,
} from "@/lib/api";
import { deriveSearchSuggestions } from "@/lib/profileSearchSuggestions";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.3, duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  }),
};

function StatCard({
  label,
  target,
  icon,
  accentClass,
}: {
  label: string;
  target: number;
  icon: React.ReactNode;
  accentClass: string;
}) {
  const value = useCountUp(target);

  return (
    <div className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5">
      <div className={`flex items-center gap-2 ${accentClass}`}>
        {icon}
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-slate-100">
        {value}
      </p>
    </div>
  );
}

function ProfileDataCard({
  title,
  value,
  icon,
  index,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="text-blue-300">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-7 text-slate-300">{value}</p>
    </motion.div>
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
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
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

  const profileHints = useMemo(() => {
    return buildProfileHints(data?.profile);
  }, [data?.profile]);

  const profileCards = useMemo(() => {
    if (!data?.profile) return [];

    return [
      {
        title: "Skills",
        value: data.profile.skills?.length
          ? data.profile.skills.join(", ")
          : "—",
        icon: <Sparkles size={16} />,
      },
      {
        title: "Technologies",
        value: data.profile.technologies?.length
          ? data.profile.technologies.join(", ")
          : "—",
        icon: <Wrench size={16} />,
      },
      {
        title: "Languages",
        value: data.profile.languages?.length
          ? data.profile.languages.join(", ")
          : "—",
        icon: <Languages size={16} />,
      },
      {
        title: "Suggested roles",
        value: data.profile.suggested_roles?.length
          ? data.profile.suggested_roles.join(", ")
          : "—",
        icon: <FileText size={16} />,
      },
      {
        title: "Seniority",
        value: data.profile.seniority_level || "—",
        icon: <BarChart3 size={16} />,
      },
      {
        title: "Years of experience",
        value:
          data.profile.years_of_experience != null
            ? String(data.profile.years_of_experience)
            : "—",
        icon: <BarChart3 size={16} />,
      },
    ];
  }, [data?.profile]);

  const constellationSkills = data?.profile?.skills ?? [];
  const constellationTechnologies = data?.profile?.technologies ?? [];

  const profileHintsParam = encodeURIComponent(profileHints.join(","));

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-10 w-80" />
              <Skeleton className="mt-4 h-5 w-2/3" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
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
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
                  AI Lab
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-100">
                  {data.filename}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                  Data-driven profile intelligence — extracted signals, match
                  distribution, and a live skills constellation from your
                  resume.
                </p>
                <p className="mt-2 font-mono text-xs text-slate-500">
                  Resume ID: {data.id}
                </p>
              </div>

              <Link
                href={`/matches/${data.id}`}
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563EB]"
              >
                View Matches →
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total"
                target={matchSummary.total}
                icon={<BarChart3 size={16} />}
                accentClass="text-blue-300"
              />
              <StatCard
                label="Strong"
                target={matchSummary.strong}
                icon={<Sparkles size={16} />}
                accentClass="text-emerald-300"
              />
              <StatCard
                label="Moderate"
                target={matchSummary.moderate}
                icon={<BarChart3 size={16} />}
                accentClass="text-amber-300"
              />
              <StatCard
                label="Weak"
                target={matchSummary.weak}
                icon={<FileText size={16} />}
                accentClass="text-slate-400"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#1E2D45] bg-[#0B1120] p-6 shadow-sm lg:p-8">
            <div className="mb-6 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
                Parsed profile overview
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Structured fields extracted from the uploaded resume, mapped into
                review cards and the constellation network.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {profileCards.map((card, index) => (
                  <ProfileDataCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    index={index}
                  />
                ))}
              </div>

              <motion.div
                custom={profileCards.length}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="min-h-[360px] lg:min-h-full"
              >
                <SkillsConstellation
                  skills={constellationSkills}
                  technologies={constellationTechnologies}
                  className="h-full min-h-[420px]"
                />
              </motion.div>
            </div>
          </section>

          {searchSuggestions.length > 0 && (
            <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-100">
                Find latest jobs based on this profile
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Based on the extracted profile, try one of these higher-quality
                live job searches.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {searchSuggestions.map((suggestion) => (
                  <Link
                    key={suggestion.keyword}
                    href={`/live-jobs?keyword=${encodeURIComponent(
                      suggestion.keyword
                    )}&country=de&location=&auto=1&source=arbeitnow&hints=${profileHintsParam}`}
                    className="rounded-2xl border border-[#1E2D45] bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-500/30 hover:bg-white/5"
                  >
                    {suggestion.label}
                  </Link>
                ))}

                <Link
                  href="/live-jobs"
                  className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                >
                  Search manually
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Profile-based suggestions currently open in Arbeitnow for richer
                job descriptions and cleaner analysis.
              </p>
            </section>
          )}

          {isGeneratingMatches ? (
            <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-100">
                Finding your best job matches...
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Your profile has been parsed successfully. The system is now
                scoring it against imported jobs.
              </p>
            </section>
          ) : matchSummary.total === 0 && importedJobsCount === 0 ? (
            <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-100">
                No jobs to match against yet
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Import jobs from Adzuna to see how your profile scores against
                real postings.
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
                  className="rounded-2xl border border-[#1E2D45] px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Upload Another Resume
                </Link>
              </div>
            </section>
          ) : matchSummary.total === 0 ? (
            <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-100">
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
                  className="rounded-2xl border border-[#1E2D45] px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Search More Jobs
                </Link>
              </div>
            </section>
          ) : (
            <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-100">
                Ready to review matches
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                This resume already has stored match results. Open the matches
                page to review ranked jobs and score breakdowns.
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
                  className="rounded-2xl border border-[#1E2D45] px-4 py-2 text-sm font-medium text-slate-200"
                >
                  Browse Jobs
                </Link>
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-[#1E2D45] bg-[#111827] p-8 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
              Extracted Resume Text
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Raw text extracted from the uploaded PDF. Useful for debugging
              parser quality and understanding what the system actually
              received.
            </p>

            <div className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-[#1E2D45] bg-[#0f172a] p-5 text-sm leading-7 text-slate-300">
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
              className="rounded-2xl border border-[#1E2D45] px-5 py-3 text-sm font-medium text-slate-200"
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
