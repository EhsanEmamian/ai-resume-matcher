"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { getJobs, type JobItem } from "@/lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      try {
        const result = await getJobs(0, 20);
        setJobs(result.items);
        setTotal(result.total);
      } catch (err: any) {
        setError(err.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="p-8">Loading jobs...</main>
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
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Job Listings
              </p>
              <h1 className="mt-2 text-3xl font-bold">Available Jobs</h1>
              <p className="mt-2 text-sm text-gray-600">
                Showing {jobs.length} of {total} jobs
              </p>
            </div>

            <a
              href="/"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              Back to Upload
            </a>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              No jobs found.
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {job.location || "No location"} •{" "}
                      {job.remote ? "Remote" : "On-site"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white">
                    {job.source === "adzuna" ? "Adzuna" : "Manual"}
                  </div>
                </div>

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="mb-2 font-semibold">Required skills</p>
                    <p className="text-gray-700">
                      {job.required_skills.length
                        ? job.required_skills.join(", ")
                        : "No structured skills available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="mb-2 font-semibold">Metadata</p>
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
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                  <p className="mb-2 font-semibold">Job description</p>
                  <p className="leading-6 text-gray-700">{job.description}</p>
                </div>

                {job.source_url && (
                  <div className="mt-4">
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Open original job source
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}