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

export function useLiveJobs() {
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

    if (autoFromUrl === "1" && keywordFromUrl) {
      setPrefilledFromUrl(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location && !availableCities.includes(location)) {
      setLocation("");
    }
  }, [country, location, availableCities]);

  const executeSearch = useCallback(async () => {
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to search live jobs.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [keyword, location, country, source, maxResults, page]);

  useEffect(() => {
    if (!prefilledFromUrl || didAutoSearch) return;
    if (!keyword.trim()) return;

    setDidAutoSearch(true);
    void executeSearch();
  }, [
    prefilledFromUrl,
    didAutoSearch,
    keyword,
    executeSearch,
  ]);

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
    setPage(1);
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
    maxResults,
    setMaxResults,
    page,
    setPage,
    profileHints,
    availableCities,
    keywordSuggestions,
    showKeywordSuggestions,
    results,
    searched,
    loading,
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
