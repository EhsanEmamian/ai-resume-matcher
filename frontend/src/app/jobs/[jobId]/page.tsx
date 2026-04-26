"use client";

import { use, useEffect, useState } from "react";
import Header from "@/components/Header";
import { getJob, type JobItem } from "@/lib/api";

export default function JobDetailPage({
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
        const result = await getJob(jobId);
        setJob(result);
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
        <main className="p-8">Loading job...</main>
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

  if (!job) {
    return (
      <>
        <Header />
        <main className="p-8">Job not found.</main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Job Detail
              </p>
              <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
              <p className="mt-2 text-sm text-gray-600">{job.company}</p>
              <p className="mt-1 text-sm text-gray-500">
                {job.location || "No location"} • {job.remote ? "Remote" : "On-site"}
              </p>
            </div>

            <div className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white">
              {job.source === "adzuna" ? "Adzuna" : "Manual"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="mb-2 text-sm font-semibold">Required skills</p>
              <p className="text-sm leading-6 text-gray-700">
                {job.required_skills.length
                  ? job.required_skills.join(", ")
                  : "No structured skills available"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="mb-2 text-sm font-semibold">Metadata</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Category:</span> {job.category || "-"}</p>
                <p><span className="font-medium">Contract type:</span> {job.contract_type || "-"}</p>
                <p>
                  <span className="font-medium">Salary:</span>{" "}
                  {job.salary_min || job.salary_max
                    ? `${job.salary_min ?? "-"} - ${job.salary_max ?? "-"}`
                    : "-"}
                </p>
                <p><span className="font-medium">Source:</span> {job.source}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <p className="mb-3 text-lg font-semibold">Job description</p>
            <p className="text-sm leading-7 text-gray-700">{job.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/jobs"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              Back to Jobs
            </a>

            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
              >
                Open Original Source
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}