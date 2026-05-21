"use client";

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
  type JobSource,
} from "@/lib/api";

const PRESET_SEARCHES = [
  { keyword: "software engineer", location: "Berlin", country: "de" },
  { keyword: "python developer", location: "", country: "at" },
  { keyword: "backend developer", location: "", country: "de" },
  { keyword: "java developer", location: "Vienna", country: "at" },
];

const fieldClassName =
  "block w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-blue-400/50";

function truncateText(text: string, maxLength = 260) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function LiveJobsClient() {
  const searchParams = useSearchParams();

  const [didAutoSearch, setDidAutoSearch] = useState(false);
  const [prefilledFromUrl, setPrefilledFromUrl] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("de");
  const [source, setSource] = useState<JobSource>("arbeitnow");
  const [maxResults, setMaxResults] = useState(10);
  const [page, setPage] = useState(1);
  const [profileHints, setProfileHints] = useState<string[]>([]);

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
    const sourceFromUrl = searchParams.get("source");
    const autoFromUrl = searchParams.get("auto");
    const hintsFromUrl = searchParams.get("hints");

    if (keywordFromUrl) {
      setKeyword(keywordFromUrl);
    }

    if (locationFromUrl !== null) {
      setLocation(locationFromUrl);
    }

    if (countryFromUrl) {
      setCountry(countryFromUrl);
    }

    if (
      sourceFromUrl === "adzuna" ||
      sourceFromUrl === "arbeitnow" ||
      sourceFromUrl === "jooble"
    ) {
      setSource(sourceFromUrl);
    }

    if (hintsFromUrl) {
      setProfileHints(
        hintsFromUrl
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      );
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
    source,
    maxResults,
    page,
  ]);

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
        source,
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
        source,
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

  if (loading && !searched) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-7xl space-y-6">
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
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
              Live job discovery
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-slate-100 sm:text-5xl">
              Search real jobs before saving them.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              Discover jobs from Adzuna, Arbeitnow, and Jooble, scan lightweight
              previews, then save promising roles for deeper enrichment,
              extraction, and resume matching.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {PRESET_SEARCHES.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-200"
                >
                  {preset.keyword}
                  {preset.location ? ` • ${preset.location}` : ""}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/[0.08] px-4 py-3 text-sm leading-6 text-blue-100">
              <span className="font-semibold">Source strategy:</span>{" "}
              Adzuna gives broad coverage. Arbeitnow gives richer tech-oriented
              descriptions. Jooble adds extra aggregator coverage.
              {source === "arbeitnow"
                ? " Arbeitnow is currently selected for richer job descriptions."
                : source === "jooble"
                  ? " Jooble is currently selected for additional aggregator coverage."
                  : " Adzuna is currently selected for broader job volume."}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-2xl shadow-black/20">
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-6"
            >
              <div className="relative lg:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Search size={16} />
                  Keyword
                </label>

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className={fieldClassName}
                  placeholder="e.g. backend engineer, python developer"
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
                  className={fieldClassName}
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
                  className={fieldClassName}
                >
                  {Object.entries(LOCATIONS).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label} ({value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  Job source
                </label>

                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as JobSource)}
                  className={fieldClassName}
                >
                  <option value="adzuna">Adzuna</option>
                  <option value="arbeitnow">Arbeitnow</option>
                  <option value="jooble">Jooble</option>
                </select>

                <p className="mt-1 text-xs text-slate-500">
                  Adzuna gives broad coverage. Arbeitnow gives richer tech
                  descriptions. Jooble adds extra aggregator coverage.
                </p>
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
                  className={fieldClassName}
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
                  className={fieldClassName}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563EB] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Search Live Jobs"}
                </button>
              </div>
            </form>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-4 text-sm text-slate-300">
              Good starting examples:
              <span className="font-medium"> software engineer</span>,
              <span className="font-medium"> python developer</span>,
              <span className="font-medium"> backend developer</span>. If a city
              returns 0 results, remove the location first.
            </div>

            {profileHints.length > 0 && (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                <p className="mb-3 font-semibold">Profile hints from resume</p>

                <div className="flex flex-wrap gap-2">
                  {profileHints.map((hint) => (
                    <span
                      key={hint}
                      className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4">
                <AlertBanner variant="error">{error}</AlertBanner>
              </div>
            )}
          </section>

          {searched && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111827] px-5 py-4 text-sm text-slate-400">
              <p>
                Found{" "}
                <span className="font-mono font-semibold text-slate-100">
                  {results.length}
                </span>{" "}
                live results from{" "}
                <span className="font-mono font-semibold text-blue-300">
                  {source}
                </span>{" "}
                on page{" "}
                <span className="font-mono font-semibold text-slate-100">
                  {page}
                </span>
                .
              </p>

              <p className="font-mono text-xs text-slate-500">
                Save jobs for enrichment and deeper matching
              </p>
            </div>
          )}

          {searched && results.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-10 text-center shadow-lg shadow-black/10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0F172A]">
                <Search size={22} className="text-slate-400" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-slate-100">
                No live results found
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
                Try a broader keyword, remove the city filter, switch the
                country, or try the other source.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2 font-mono text-xs text-slate-500">
                <span className="rounded-full border border-white/10 bg-[#0F172A] px-3 py-1.5">
                  software engineer
                </span>
                <span className="rounded-full border border-white/10 bg-[#0F172A] px-3 py-1.5">
                  backend developer
                </span>
                <span className="rounded-full border border-white/10 bg-[#0F172A] px-3 py-1.5">
                  no city filter
                </span>
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
                profileHints,
              });

              const saveKey = `${job.source_id ?? "no-id"}-${index}`;
              const savedJobId = savedJobIds[saveKey];
              const isSaved = Boolean(savedJobId);
              const isSaving = savingJobIds.includes(saveKey);

              return (
                <article
                  key={`${job.source_id}-${index}`}
                  className="group rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-lg shadow-black/10 transition hover:border-blue-400/25 hover:bg-[#1B2537]"
                >
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      {job.source_url ? (
                        <a
                          href={job.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-2xl font-semibold tracking-tight text-slate-100 transition group-hover:text-blue-200"
                        >
                          {job.title}
                        </a>
                      ) : (
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
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
                      <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-center font-mono text-[11px] text-blue-200">
                        {job.source === "arbeitnow"
                          ? "Arbeitnow · richer text"
                          : job.source === "jooble"
                            ? "Jooble · aggregator"
                            : "Adzuna · broad reach"}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveJob(job, index)}
                        disabled={isSaved || isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                    <div className="mb-4 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4 text-sm">
                      <p className="mb-3 font-semibold text-blue-100">
                        Profile rationale
                      </p>

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

                  <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 text-sm">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      Job preview
                    </p>

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