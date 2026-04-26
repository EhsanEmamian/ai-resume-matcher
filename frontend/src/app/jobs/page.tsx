"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { getJobs, type JobItem } from "@/lib/api";

type SourceFilter = "all" | "manual" | "adzuna";
type SortValue = "newest" | "title" | "company";

const PAGE_SIZE = 10;

function truncateText(text: string, maxLength = 220) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadJobs() {
      try {
        const result = await getJobs(0, 100);
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

  function toggleExpanded(jobId: string) {
    setExpandedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  }

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      const matchesSource =
        sourceFilter === "all" ? true : job.source === sourceFilter;

      const searchableText = [
        job.title,
        job.company,
        job.description,
        job.category ?? "",
        ...(job.required_skills ?? []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : searchableText.includes(normalizedSearch);

      return matchesSource && matchesSearch;
    });

    const sorted = [...filtered];

    if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "company") {
      sorted.sort((a, b) => a.company.localeCompare(b.company));
    } else {
      sorted.sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
    }

    return sorted;
  }, [jobs, search, sourceFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, sourceFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);

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
                Showing {paginatedJobs.length} jobs on page {currentPage} of {totalPages}
                {" "}• Filtered: {filteredJobs.length} • Backend total: {total}
              </p>
            </div>

            <a
              href="/"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              Back to Home
            </a>
          </div>

          <section className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Search title, company, description, category, skills
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Filter by source
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "manual", "adzuna"] as SourceFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSourceFilter(value)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      sourceFilter === value
                        ? "bg-black text-white"
                        : "border border-gray-300 bg-white text-black"
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="title">Title</option>
                <option value="company">Company</option>
              </select>
            </div>
          </section>

          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              No jobs found for the current filters.
            </div>
          ) : (
            <>
              {paginatedJobs.map((job) => {
                const isExpanded = expandedJobIds.includes(job.id);
                const descriptionToShow = isExpanded
                  ? job.description
                  : truncateText(job.description);

                return (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">
                          <Link href={`/jobs/${job.id}`} className="hover:underline">
                            {job.title}
                          </Link>
                        </h2>
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
                      <p className="leading-6 text-gray-700">{descriptionToShow}</p>

                      {job.description.length > 220 && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(job.id)}
                          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
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
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}