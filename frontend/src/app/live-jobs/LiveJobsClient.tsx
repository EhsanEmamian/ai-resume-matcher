"use client";

import { Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import LiveJobsSearchForm from "@/components/LiveJobsSearchForm";
import LiveJobCard from "@/components/LiveJobCard";
import type { ExternalJobItem } from "@/lib/api";
import { PRESET_SEARCHES, useLiveJobs } from "@/hooks/useLiveJobs";

function getLiveJobCardKey(job: ExternalJobItem, index: number) {
  const sourceId = job.source_id?.trim();
  if (sourceId) {
    return `${job.source}-${sourceId}`;
  }
  return `${job.source}-row-${index}`;
}

export default function LiveJobsClient() {
  const {
    keyword,
    setKeyword,
    location,
    setLocation,
    country,
    setCountry,
    source,
    setSource,
    profileHints,
    availableCities,
    keywordSuggestions,
    showKeywordSuggestions,
    results,
    hasMoreResults,
    searched,
    loading,
    isLoadingMore,
    loadMore,
    error,
    expandedIndexes,
    savedJobIds,
    savingJobIds,
    handleSubmit,
    applyPreset,
    toggleExpanded,
    handleSaveJob,
    getSaveKey,
    showInitialLoading,
  } = useLiveJobs();

  if (showInitialLoading) {
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

          <LiveJobsSearchForm
            keyword={keyword}
            onKeywordChange={setKeyword}
            keywordSuggestions={keywordSuggestions}
            showKeywordSuggestions={showKeywordSuggestions}
            location={location}
            onLocationChange={setLocation}
            availableCities={availableCities}
            country={country}
            onCountryChange={setCountry}
            source={source}
            onSourceChange={setSource}
            profileHints={profileHints}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />

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
            <div className="space-y-6">
              {results.map((job, index) => {
                const saveKey = getSaveKey(job, index);
                const savedJobId = savedJobIds[saveKey];

                return (
                  <LiveJobCard
                    key={getLiveJobCardKey(job, index)}
                    job={job}
                    index={index}
                    keyword={keyword}
                    profileHints={profileHints}
                    isExpanded={expandedIndexes.includes(index)}
                    onToggleExpanded={toggleExpanded}
                    isSaved={Boolean(savedJobId)}
                    isSaving={savingJobIds.includes(saveKey)}
                    savedJobId={savedJobId}
                    onSave={handleSaveJob}
                  />
                );
              })}

              {hasMoreResults && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={isLoadingMore || loading}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-100 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
