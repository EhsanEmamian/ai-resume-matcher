"use client";

import { useState } from "react";
import { ingestJobs, type IngestJobsResult } from "@/lib/api";

const COUNTRY_OPTIONS = [
  { value: "de", label: "Germany (de)" },
  { value: "at", label: "Austria (at)" },
  { value: "gb", label: "United Kingdom (gb)" },
  { value: "us", label: "United States (us)" },
];

const PRESET_SEARCHES = [
  { keyword: "software engineer", location: "Berlin", country: "de" },
  { keyword: "python developer", location: "Vienna", country: "at" },
  { keyword: "backend developer", location: "", country: "de" },
];

export default function JobIngestionPanel() {
  const [keyword, setKeyword] = useState("python backend developer");
  const [location, setLocation] = useState("Berlin");
  const [country, setCountry] = useState("de");
  const [maxResults, setMaxResults] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IngestJobsResult | null>(null);

  function applyPreset(preset: {
    keyword: string;
    location: string;
    country: string;
  }) {
    setKeyword(preset.keyword);
    setLocation(preset.location);
    setCountry(preset.country);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await ingestJobs({
        keyword,
        location,
        country,
        max_results: maxResults,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to ingest jobs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Job Import
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-100">Import jobs from Adzuna</h2>
        <p className="mt-2 text-sm text-slate-400">
          Fetch real job postings from Adzuna and store them in the backend.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESET_SEARCHES.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-2xl border border-white/10 bg-[#0f172a] px-3 py-2 text-sm font-medium text-slate-200"
          >
            {preset.keyword} {preset.location ? `• ${preset.location}` : ""}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-200">Keyword</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
            placeholder="python backend developer"
          />
          <p className="mt-1 text-xs text-slate-500">
            Broader queries often work better, مثل: software engineer, python developer, backend.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
            placeholder="Berlin or Vienna"
          />
          <p className="mt-1 text-xs text-slate-500">
            Optional. If results are too narrow, leave this empty.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Country</label>
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
          <p className="mt-1 text-xs text-slate-500">
            Choose the country code that matches the market you want to search.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">Max results</label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import Jobs"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0f172a] p-4">
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Import summary</h3>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p><span className="font-semibold">Keyword:</span> {result.keyword}</p>
            <p><span className="font-semibold">Location:</span> {result.location || "-"}</p>
            <p><span className="font-semibold">Country:</span> {result.country}</p>
            <p><span className="font-semibold">Fetched:</span> {result.fetched}</p>
            <p><span className="font-semibold">Created:</span> {result.created}</p>
            <p><span className="font-semibold">Skipped:</span> {result.skipped}</p>
            <p><span className="font-semibold">Errors:</span> {result.errors}</p>
          </div>

          {result.fetched === 0 && (
            <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              No jobs were returned. Try a broader keyword, remove the location,
              or switch the country.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/jobs"
              className="rounded-2xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white"
            >
              View Imported Jobs
            </a>
            <a
              href="#upload"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Upload Resume Next
            </a>
            <a
              href="/live-jobs"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Open Live Search
            </a>
          </div>
        </div>
      )}
    </section>
  );
}