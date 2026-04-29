"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  MapPin,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import {
  clearJobsBySource,
  deleteJob,
  getJobs,
  type JobItem,
} from "@/lib/api";

type SourceFilter = "all" | "manual" | "adzuna";
type SortValue = "newest" | "title" | "company";

const PAGE_SIZE = 10;

function truncateText(text: string, maxLength = 220) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function JobsClient() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [actionMessage, setActionMessage] = useState("");
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [isClearingAdzuna, setIsClearingAdzuna] = useState(false);

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

  useEffect(() => {
    loadJobs();
  }, []);

  function toggleExpanded(jobId: string) {
    setExpandedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  }

  async function handleDeleteJob(jobId: string) {
    const confirmed = window.confirm("Delete this job?");
    if (!confirmed) return;

    setBusyJobId(jobId);
    setActionMessage("");

    try {
      await deleteJob(jobId);
      await loadJobs();
      setActionMessage("Job deleted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to delete job.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleClearAdzunaJobs() {
    const confirmed = window.confirm("Delete all Adzuna jobs?");
    if (!confirmed) return;

    setIsClearingAdzuna(true);
    setActionMessage("");

    try {
      const result = await clearJobsBySource("adzuna");
      await loadJobs();
      setActionMessage(`${result.deleted} Adzuna jobs deleted.`);
    } catch (err: any) {
      setError(err.message || "Failed to clear Adzuna jobs.");
    } finally {
      setIsClearingAdzuna(false);
    }
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
        job.experience_requirement ?? "",
        job.salary_text ?? "",
        ...(job.required_skills ?? []),
        ...(job.required_languages ?? []),
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
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-10 w-72" />
              <Skeleton className="mt-4 h-5 w-2/3" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>

            <SkeletonCard />
            <SkeletonCard />
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

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Imported Job Pool
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  Saved Jobs
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Browse jobs already stored in your local database. Use search,
                  filters, sorting, and pagination to review the saved pool.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleClearAdzunaJobs}
                  disabled={isClearingAdzuna}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 disabled:opacity-50"
                >
                  {isClearingAdzuna ? "Clearing..." : "Clear Adzuna Jobs"}
                </button>

                <Link
                  href="/live-jobs"
                  className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white shadow-sm"
                >
                  Open Live Search
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Loaded
                </p>
                <p className="mt-2 text-3xl font-bold">{jobs.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Filtered
                </p>
                <p className="mt-2 text-3xl font-bold">{filteredJobs.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Backend Total
                </p>
                <p className="mt-2 text-3xl font-bold">{total}</p>
              </div>
            </div>

            {actionMessage && (
              <div className="mt-5">
                <AlertBanner variant="success">{actionMessage}</AlertBanner>
              </div>
            )}
          </section>

          <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm md:grid-cols-3">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Search size={16} />
                Search jobs
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, company, description, skills..."
                className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Briefcase size={16} />
                Source
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "manual", "adzuna"] as SourceFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSourceFilter(value)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      sourceFilter === value
                        ? "bg-[#3B82F6] text-white"
                        : "border border-white/10 bg-[#0f172a] text-slate-200"
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <SlidersHorizontal size={16} />
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
                className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
              >
                <option value="newest">Newest</option>
                <option value="title">Title</option>
                <option value="company">Company</option>
              </select>
            </div>
          </section>

          <div className="text-sm text-slate-400">
            Showing {paginatedJobs.length} jobs on page {currentPage} of{" "}
            {totalPages}
          </div>

          {filteredJobs.length === 0 ? (
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827] shadow-sm">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[280px] bg-[#0f172a]">
                  <Image
                    src="/images/empty-no-imported-jobs.png"
                    alt="No imported jobs illustration"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h2 className="text-xl font-semibold">
                    No imported jobs found
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Try a different search, switch the source filter, or import
                    more jobs from live search.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/live-jobs"
                      className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
                    >
                      Search Live Jobs
                    </Link>
                    <Link
                      href="/"
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                    >
                      Go Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {paginatedJobs.map((job) => {
                const isExpanded = expandedJobIds.includes(job.id);
                const descriptionToShow = isExpanded
                  ? job.description
                  : truncateText(job.description);

                return (
                  <article
                    key={job.id}
                    className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm"
                  >
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="hover:underline"
                          >
                            {job.title}
                          </Link>
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Building2 size={15} />
                            {job.company}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={15} />
                            {job.location || "No location"}
                          </span>
                          <span>{job.remote ? "Remote" : "On-site"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white">
                          {job.source === "adzuna" ? "Adzuna" : "Manual"}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={busyJobId === job.id}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          {busyJobId === job.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                        <p className="mb-2 font-semibold">Required skills</p>
                        <p className="leading-6 text-slate-300">
                          {job.required_skills.length
                            ? job.required_skills.join(", ")
                            : "No structured skills available"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
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
                            ? `${job.salary_min ?? "-"} - ${
                                job.salary_max ?? "-"
                              }`
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
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                      <p className="mb-2 font-semibold">Job description</p>
                      <p className="leading-7 text-slate-300">
                        {descriptionToShow}
                      </p>

                      {job.description.length > 220 && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(job.id)}
                          className="mt-3 text-sm font-medium text-[#60A5FA] hover:underline"
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
                          className="text-sm font-medium text-[#60A5FA] hover:underline"
                        >
                          Open original job source
                        </a>
                      </div>
                    )}
                  </article>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/10 bg-[#111827] p-4 shadow-sm">
                <p className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}