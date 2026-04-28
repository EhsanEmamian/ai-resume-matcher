"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Globe, MapPin, Save, BriefcaseBusiness } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  importExternalJob,
  searchExternalJobs,
  type ExternalJobItem,
} from "@/lib/api";

const COUNTRY_OPTIONS = [
  { value: "de", label: "Germany (de)" },
  { value: "at", label: "Austria (at)" },
  { value: "gb", label: "United Kingdom (gb)" },
  { value: "us", label: "United States (us)" },
];

const PRESET_SEARCHES = [
  { keyword: "software engineer", location: "Berlin", country: "de" },
  { keyword: "python developer", location: "", country: "at" },
  { keyword: "backend developer", location: "", country: "de" },
  { keyword: "java developer", location: "Vienna", country: "at" },
];

function truncateText(text: string, maxLength = 260) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function LiveJobsPage() {
  const [keyword, setKeyword] = useState("software engineer");
  const [location, setLocation] = useState("Berlin");
  const [country, setCountry] = useState("de");
  const [maxResults, setMaxResults] = useState(10);
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<ExternalJobItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Record<string, string>>({});
  const [savingJobIds, setSavingJobIds] = useState<string[]>([]);

  function toggleExpanded(index: number) {
    setExpandedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  }

  function applyPreset(preset: {
    keyword: string;
    location: string;
    country: string;
  }) {
    setKeyword(preset.keyword);
    setLocation(preset.location);
    setCountry(preset.country);
    setPage(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSearched(false);
    setExpandedIndexes([]);

    try {
      const data = await searchExternalJobs({
        keyword,
        location,
        country,
        max_results: maxResults,
        page,
      });

      setResults(data.items);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Failed to search live jobs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveJob(job: ExternalJobItem, index: number) {
    const saveKey = `${job.source_id ?? "no-id"}-${index}`;

    setSavingJobIds((prev) => [...prev, saveKey]);

    try {
      const result = await importExternalJob(job);
      setSavedJobIds((prev) => ({
        ...prev,
        [saveKey]: result.job.id,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to save job.");
    } finally {
      setSavingJobIds((prev) => prev.filter((id) => id !== saveKey));
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              External Job Search
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Live Adzuna Search
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Search jobs live from Adzuna without importing them first. Save only
              the jobs you actually want in your local database.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {PRESET_SEARCHES.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-200"
                >
                  {preset.keyword}
                  {preset.location ? ` • ${preset.location}` : ""}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Search size={16} />
                  Keyword
                </label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                  placeholder="software engineer"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Broader searches often work better than narrow titles.
                </p>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <MapPin size={16} />
                  Location
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                  placeholder="Berlin or Vienna"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional. Leave empty for broader results.
                </p>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Globe size={16} />
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Page</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Max results</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Search Live Jobs"}
                </button>
              </div>
            </form>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm text-slate-300">
              Good starting examples:
              <span className="font-medium"> software engineer</span>,
              <span className="font-medium"> python developer</span>,
              <span className="font-medium"> backend developer</span>.
              If a city returns 0 results, remove the location first.
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </section>

          {searched && (
            <div className="text-sm text-slate-400">
              Found <span className="font-semibold">{results.length}</span> live results
              on page <span className="font-semibold">{page}</span>.
            </div>
          )}

          {searched && results.length === 0 ? (
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111827] shadow-sm">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[280px] bg-[#0f172a]">
                  <Image
                    src="/images/empty-no-live-results.png"
                    alt="No live search results illustration"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h2 className="text-xl font-semibold">No live results found</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Try a broader keyword, remove the location, or switch the country.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            results.map((job, index) => {
              const isExpanded = expandedIndexes.includes(index);
              const descriptionToShow = isExpanded
                ? job.description
                : truncateText(job.description);

              const saveKey = `${job.source_id ?? "no-id"}-${index}`;
              const savedJobId = savedJobIds[saveKey];
              const isSaved = Boolean(savedJobId);
              const isSaving = savingJobIds.includes(saveKey);

              return (
                <article
                  key={`${job.source_id}-${index}`}
                  className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm"
                >
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      {job.source_url ? (
                        <a
                          href={job.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-2xl font-semibold tracking-tight hover:underline"
                        >
                          {job.title}
                        </a>
                      ) : (
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {job.title}
                        </h2>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <BriefcaseBusiness size={15} />
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
                        Live Adzuna
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveJob(job, index)}
                        disabled={isSaved || isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-200 disabled:opacity-50"
                      >
                        <Save size={15} />
                        {isSaved ? "Saved" : isSaving ? "Saving..." : "Save Job"}
                      </button>

                      {savedJobId && (
                        <Link
                          href={`/jobs/${savedJobId}`}
                          className="rounded-2xl border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-200 hover:bg-white/5"
                        >
                          View Saved Job
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                      <p className="mb-2 font-semibold">Metadata</p>
                      <p><span className="font-medium">Category:</span> {job.category || "Not specified"}</p>
                      <p><span className="font-medium">Contract type:</span> {job.contract_type || "Not specified"}</p>
                      <p>
                        <span className="font-medium">Salary:</span>{" "}
                        {job.salary_min || job.salary_max
                          ? `${job.salary_min ?? "-"} - ${job.salary_max ?? "-"}`
                          : "Not provided"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                      <p className="mb-2 font-semibold">Structured skills</p>
                      <p className="leading-6 text-slate-300">
                        {job.required_skills.length
                          ? job.required_skills.join(", ")
                          : "No structured skills available"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                    <p className="mb-2 font-semibold">Job description</p>
                    <p className="leading-7 text-slate-300">{descriptionToShow}</p>

                    {job.description.length > 260 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(index)}
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
            })
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}