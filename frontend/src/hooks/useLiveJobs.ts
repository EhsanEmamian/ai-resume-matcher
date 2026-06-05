"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LOCATIONS } from "@/lib/locations";
import { filterJobTitleSuggestions } from "@/lib/jobTitleSuggestions";
import {
  importExternalJob,
  searchExternalJobs,
  type ExternalJobItem,
  type JobSource,
} from "@/lib/api";

export const PRESET_SEARCHES = [
  { keyword: "software engineer", location: "Berlin", country: "de" },
  { keyword: "python developer", location: "", country: "at" },
  { keyword: "backend developer", location: "", country: "de" },
  { keyword: "java developer", location: "Vienna", country: "at" },
] as const;

export type LiveJobPreset = (typeof PRESET_SEARCHES)[number];

export const LIVE_JOBS_PAGE_SIZE = 20;

export function useLiveJobs() {
  const searchParams = useSearchParams();

  const [didAutoSearch, setDidAutoSearch] = useState(false);
  const [prefilledFromUrl, setPrefilledFromUrl] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("de");
  const [source, setSource] = useState<JobSource>("adzuna");
  const [profileHints, setProfileHints] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [results, setResults] = useState<ExternalJobItem[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Record<string, string>>({});
  const [savingJobIds, setSavingJobIds] = useState<string[]>([]);

  const availableCities = LOCATIONS[country]?.cities ?? [];

  const keywordSuggestions = useMemo(
    () => filterJobTitleSuggestions(keyword),
    [keyword]
  );

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

    if (autoFromUrl === "1") {
      setPrefilledFromUrl(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location && !availableCities.includes(location)) {
      setLocation("");
    }
  }, [country, location, availableCities]);

  const fetchResultsPage = useCallback(
    async (pageToFetch: number, append: boolean) => {
      const data = await searchExternalJobs({
        keyword,
        location,
        country,
        source,
        max_results: LIVE_JOBS_PAGE_SIZE,
        page: pageToFetch,
      });

      const incoming = Array.isArray(data.items) ? data.items : [];

      setResults((prev) => {
        if (!append) {
          return incoming;
        }

        const seen = new Set(
          prev.map((job) => `${job.source}:${job.source_id ?? ""}`)
        );

        const uniqueIncoming = incoming.filter((job) => {
          const dedupeKey = `${job.source}:${job.source_id ?? ""}`;
          if (seen.has(dedupeKey)) {
            return false;
          }
          seen.add(dedupeKey);
          return true;
        });

        return [...prev, ...uniqueIncoming];
      });
      setPage(pageToFetch);
      setHasMoreResults(incoming.length >= LIVE_JOBS_PAGE_SIZE);
      setSearched(true);

      return data;
    },
    [keyword, location, country, source]
  );

  const executeSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    setSearched(false);
    setExpandedIndexes([]);
    setHasMoreResults(false);

    try {
      await fetchResultsPage(1, false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to search live jobs.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchResultsPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || loading || !hasMoreResults) return;

    setIsLoadingMore(true);
    setError("");

    try {
      await fetchResultsPage(page + 1, true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load more jobs.";
      setError(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    fetchResultsPage,
    hasMoreResults,
    isLoadingMore,
    loading,
    page,
  ]);

  useEffect(() => {
    if (!prefilledFromUrl || didAutoSearch) return;

    setDidAutoSearch(true);
    void executeSearch();
  }, [prefilledFromUrl, didAutoSearch, executeSearch]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await executeSearch();
    },
    [executeSearch]
  );

  const applyPreset = useCallback((preset: LiveJobPreset) => {
    setKeyword(preset.keyword);
    setLocation(preset.location);
    setCountry(preset.country);
  }, []);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  }, []);

  const handleSaveJob = useCallback(
    async (job: ExternalJobItem, index: number) => {
      const saveKey = `${job.source_id ?? "no-id"}-${index}`;

      setSavingJobIds((prev) => [...prev, saveKey]);

      try {
        const result = await importExternalJob(job);
        setSavedJobIds((prev) => ({
          ...prev,
          [saveKey]: result.job.id,
        }));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to save job.";
        setError(message);
      } finally {
        setSavingJobIds((prev) => prev.filter((id) => id !== saveKey));
      }
    },
    []
  );

  const getSaveKey = useCallback(
    (job: ExternalJobItem, index: number) =>
      `${job.source_id ?? "no-id"}-${index}`,
    []
  );

  const showInitialLoading = loading && !searched;

  return {
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
  };
}
