"use client";

import { Globe, MapPin, Search } from "lucide-react";
import AlertBanner from "@/components/AlertBanner";
import { LOCATIONS } from "@/lib/locations";
import type { JobSource } from "@/lib/api";

const fieldClassName =
  "block w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-blue-400/50";

type LiveJobsSearchFormProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  keywordSuggestions: string[];
  showKeywordSuggestions: boolean;
  location: string;
  onLocationChange: (value: string) => void;
  availableCities: string[];
  country: string;
  onCountryChange: (value: string) => void;
  source: JobSource;
  onSourceChange: (value: JobSource) => void;
  page: number;
  onPageChange: (value: number) => void;
  maxResults: number;
  onMaxResultsChange: (value: number) => void;
  profileHints: string[];
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
};

const SOURCE_OPTIONS: {
  value: JobSource;
  label: string;
  hint: string;
}[] = [
  {
    value: "adzuna",
    label: "Adzuna",
    hint: "Broad coverage across all job types and regions.",
  },
  {
    value: "arbeitnow",
    label: "Arbeitnow",
    hint: "Richer tech job descriptions, strong for Europe.",
  },
  {
    value: "remotive",
    label: "Remotive",
    hint: "Great for tech and remote roles — full descriptions natively, no enrichment needed.",
  },
  {
    value: "jooble",
    label: "Jooble",
    hint: "Extra aggregator coverage for broader regional reach.",
  },
];

export default function LiveJobsSearchForm({
  keyword,
  onKeywordChange,
  keywordSuggestions,
  showKeywordSuggestions,
  location,
  onLocationChange,
  availableCities,
  country,
  onCountryChange,
  source,
  onSourceChange,
  page,
  onPageChange,
  maxResults,
  onMaxResultsChange,
  profileHints,
  loading,
  error,
  onSubmit,
}: LiveJobsSearchFormProps) {
  const activeSourceHint =
    SOURCE_OPTIONS.find((s) => s.value === source)?.hint ?? "";

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-2xl shadow-black/20">
      <form
        onSubmit={onSubmit}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-6"
      >
        {/* Keyword */}
        <div className="relative lg:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Search size={16} />
            Keyword
          </label>

          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
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
                  onClick={() => onKeywordChange(suggestion)}
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

        {/* City */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            <MapPin size={16} />
            City
          </label>

          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
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

        {/* Country */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Globe size={16} />
            Country
          </label>

          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className={fieldClassName}
          >
            {Object.entries(LOCATIONS).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label} ({value})
              </option>
            ))}
          </select>
        </div>

        {/* Job source */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
            Job source
          </label>

          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value as JobSource)}
            className={fieldClassName}
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Dynamic hint updates based on selected source */}
          <p className="mt-1 text-xs text-slate-500">{activeSourceHint}</p>
        </div>

        {/* Page */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Page
          </label>

          <input
            type="number"
            min={1}
            max={20}
            value={page}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className={fieldClassName}
          />
        </div>

        {/* Max results */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Max results
          </label>

          <input
            type="number"
            min={1}
            max={50}
            value={maxResults}
            onChange={(e) => onMaxResultsChange(Number(e.target.value))}
            className={fieldClassName}
          />
        </div>

        {/* Submit */}
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

      {/* Tips */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0F172A] p-4 text-sm text-slate-300">
        Good starting examples:
        <span className="font-medium"> software engineer</span>,
        <span className="font-medium"> python developer</span>,
        <span className="font-medium"> backend developer</span>. If a city
        returns 0 results, remove the location first.
      </div>

      {/* Profile hints */}
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

      {/* Error */}
      {error && (
        <div className="mt-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}
    </section>
  );
}