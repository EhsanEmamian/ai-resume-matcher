"use client";

import { useState } from "react";
import { ingestJobs, type IngestJobsResult } from "@/lib/api";

export default function JobIngestionPanel() {
  const [keyword, setKeyword] = useState("python backend developer");
  const [location, setLocation] = useState("Berlin");
  const [country, setCountry] = useState("de");
  const [maxResults, setMaxResults] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IngestJobsResult | null>(null);

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
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
          Job Import
        </p>
        <h2 className="mt-2 text-2xl font-bold">Import jobs from Adzuna</h2>
        <p className="mt-2 text-sm text-gray-600">
          Fetch real job postings from Adzuna and store them in the backend.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Keyword</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            placeholder="python backend developer"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            placeholder="Berlin"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Country</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            placeholder="de"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Max results</label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import Jobs"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="mb-3 text-lg font-semibold">Import summary</h3>
          <div className="grid gap-3 text-sm text-gray-800 sm:grid-cols-2">
            <p>
              <span className="font-semibold">Keyword:</span> {result.keyword}
            </p>
            <p>
              <span className="font-semibold">Location:</span>{" "}
              {result.location || "-"}
            </p>
            <p>
              <span className="font-semibold">Country:</span> {result.country}
            </p>
            <p>
              <span className="font-semibold">Fetched:</span> {result.fetched}
            </p>
            <p>
              <span className="font-semibold">Created:</span> {result.created}
            </p>
            <p>
              <span className="font-semibold">Skipped:</span> {result.skipped}
            </p>
            <p>
              <span className="font-semibold">Errors:</span> {result.errors}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/jobs"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              View Jobs
            </a>
            <a
              href="#upload"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Upload Resume Next
            </a>
          </div>
        </div>
      )}
    </section>
  );
}