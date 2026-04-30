"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Globe,
  MapPin,
  Save,
  BriefcaseBusiness,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import AlertBanner from "@/components/AlertBanner";
import { LOCATIONS } from "@/lib/locations";
import { filterJobTitleSuggestions } from "@/lib/jobTitleSuggestions";
import { deriveLiveJobRationale } from "@/lib/liveJobRationale";
import {
  importExternalJob,
  searchExternalJobs,
  type ExternalJobItem,
} from "@/lib/api";

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

export default function LiveJobsClient() {
  const searchParams = useSearchParams();

  const [didAutoSearch, setDidAutoSearch] = useState(false);
  const [prefilledFromUrl, setPrefilledFromUrl] = useState(false);

  const [keyword, setKeyword] = useState("software engineer");
  const [location, setLocation] = useState("");
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

  const availableCities = LOCATIONS[country]?.cities ?? [];
  const keywordSuggestions = filterJobTitleSuggestions(keyword);
  const showKeywordSuggestions =
    keyword.trim().length > 0 &&
    keywordSuggestions.length > 0 &&
    !keywordSuggestions.some(
      (item) => item.toLowerCase() === keyword.trim().toLowerCase()
    );

  useEffect(() => {
    const keywordFromUrl = searchParams.get("keyword");
    const locationFromUrl = searchParams.get("location");
    const countryFromUrl = searchParams.get("country");
    const autoFromUrl = searchParams.get("auto");

    if (keywordFromUrl) {
      setKeyword(keywordFromUrl);
    }

    if (locationFromUrl !== null) {
      setLocation(locationFromUrl);
    }

    if (countryFromUrl) {
      setCountry(countryFromUrl);
    }

    if (autoFromUrl === "1" && keywordFromUrl) {
      setPrefilledFromUrl(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location && !availableCities.includes(location)) {
      setLocation("");
    }
  }, [country, location, availableCities]);

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

  async function runAutoSearch() {
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

  useEffect(() => {
    if (!prefilledFromUrl || didAutoSearch) return;
    if (!keyword.trim()) return;

    setDidAutoSearch(true);
    runAutoSearch();
  }, [
    prefilledFromUrl,
    didAutoSearch,
    keyword,
    location,
    country,
    maxResults,
    page,
  ]);

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

  if (loading && !searched) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-4 h-10 w-72" />
              <Skeleton className="mt-4 h-5 w-2/3" />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="mt-4 h-12 w-full" />
              <Skeleton className="mt-4 h-12 w-full" />
            </div>

            <SkeletonCard />
            <SkeletonCard />
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
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              External Job Search
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Live Adzuna Search
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Search jobs live from Adzuna without importing them first. Live job
              previews are lightweight for fast scanning. Full details and deeper
              extraction become available after saving.
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

            <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              Live job previews · Full details, requirements, languages,
              experience, and salary extraction become available after saving.
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
            >
              <div className="relative lg:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Search size={16} />
                  Keyword
                </label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                  placeholder="software engineer"
                  autoComplete="off"
                />

                {showKeywordSuggestions && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-lg">
                    {keywordSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setKeyword(suggestion)}
                        className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm text-slate-200 last:border-b-0 hover:bg-white/5"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-1 text-xs text-slate-500">
                  Broader searches often work better than narrow titles.
                </p>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <MapPin size={16} />
                  City
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
                >
                  <option value="">All cities</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Optional. Leave empty for broader country-wide results.
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
                  {Object.entries(LOCATIONS).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label} ({value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Page
                </label>
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
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Max results
                </label>
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
              <span className="font-medium"> backend developer</span>. If a city
              returns 0 results, remove the location first.
            </div>

            {error && (
              <div className="mt-4">
                <AlertBanner variant="error">{error}</AlertBanner>
              </div>
            )}
          </section>

          {searched && (
            <div className="text-sm text-slate-400">
              Found <span className="font-semibold">{results.length}</span> live
              results on page <span className="font-semibold">{page}</span>.
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
                    Try a broader keyword, remove the location, or switch the
                    country.
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

              const rationale = deriveLiveJobRationale({
                keyword,
                title: job.title,
                description: job.description,
              });

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
                        {isSaved
                          ? "Saved"
                          : isSaving
                            ? "Saving..."
                            : "Save & Analyze"}
                      </button>

                      {savedJobId && (
                        <Link
                          href={`/jobs/${savedJobId}`}
                          className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-center text-sm font-medium text-emerald-300 hover:bg-emerald-500/15"
                        >
                          Saved · View Analysis
                        </Link>
                      )}
                    </div>
                  </div>

                  {rationale.length > 0 && (
                    <div className="mb-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                      <p className="mb-3 font-semibold">Why suggested</p>
                      <div className="flex flex-wrap gap-2">
                        {rationale.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-200"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm">
                    <p className="mb-2 font-semibold">Job preview</p>
                    <p className="leading-7 text-slate-300">
                      {descriptionToShow}
                    </p>

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
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#60A5FA] hover:underline"
                      >
                        <ArrowUpRight size={14} />
                        View original posting
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