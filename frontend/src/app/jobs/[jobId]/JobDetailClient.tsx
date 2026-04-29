"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Building2, MapPin, BriefcaseBusiness } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import { Skeleton } from "@/components/Skeleton";
import { getJob, type JobItem } from "@/lib/api";

export default function JobDetailClient({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);

  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await getJob(jobId);
        setJob(data);
      } catch (err: any) {
        setError(err.message || "Failed to load job.");
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
                <Skeleton className="h-40 w-full" />
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
                <Skeleton className="h-40 w-full" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
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

  if (!job) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-4xl">
            <AlertBanner variant="error">Job not found.</AlertBanner>
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Job Detail
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  {job.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={15} />
                    {job.company}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={15} />
                    {job.location || "No location"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BriefcaseBusiness size={15} />
                    {job.remote ? "Remote" : "On-site"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white">
                {job.source === "adzuna" ? "Adzuna" : "Manual"}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Required skills</h2>
              <p className="font-mono text-xs leading-7 text-slate-300">
                {job.required_skills.length
                  ? job.required_skills.join(", ")
                  : "No structured skills available"}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Metadata</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  <span className="font-medium">Category:</span>{" "}
                  {job.category || "-"}
                </p>
                <p>
                  <span className="font-medium">Contract type:</span>{" "}
                  {job.contract_type || "-"}
                </p>
                <p>
                  <span className="font-medium">Salary:</span>{" "}
                  {job.salary_min || job.salary_max
                    ? `${job.salary_min ?? "-"} - ${job.salary_max ?? "-"}`
                    : job.salary_text || "-"}
                </p>
                <p>
                  <span className="font-medium">Languages:</span>{" "}
                  {job.required_languages.length
                    ? job.required_languages.join(", ")
                    : "-"}
                </p>
                <p>
                  <span className="font-medium">Experience:</span>{" "}
                  {job.experience_requirement || "-"}
                </p>
                <p>
                  <span className="font-medium">Posted at:</span>{" "}
                  {job.posted_at || "-"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Job description</h2>
            <p className="leading-8 text-slate-300">{job.description}</p>
          </section>

          {job.source_url && (
            <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Original source</h2>
              <a
                href={job.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[#60A5FA] hover:underline"
              >
                Open original job source
              </a>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200"
            >
              Back to Jobs
            </Link>
            <Link
              href="/live-jobs"
              className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white"
            >
              Open Live Search
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}