"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  searchExternalJobs,
  type ExternalJobItem,
} from "@/lib/api";

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
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);

  function toggleExpanded(index: number) {
    setExpandedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
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
      setTotal(data.total);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Failed to search live jobs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
              External Job Search
            </p>
            <h1 className="mt-2 text-3xl font-bold">Live Adzuna Search</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Search jobs live from Adzuna without importing them first. This is
              different from the Imported Jobs page, which only shows jobs already
              stored in your local database.
            </p>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium">Keyword</label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  placeholder="software engineer"
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
                <label className="mb-1 block text-sm font-medium">Page</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
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

              <div className="md:col-span-2 lg:col-span-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Search Live Jobs"}
                </button>
              </div>
            </form>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              Try broader searches first, مثل:
              <span className="font-medium"> software engineer</span>,
              <span className="font-medium"> python developer</span>,
              <span className="font-medium"> backend</span>.
              If a city returns 0 results, try leaving location empty and search country-wide.
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </section>

          {searched && (
            <div className="text-sm text-gray-600">
              Found <span className="font-semibold">{results.length}</span> live results
              on page <span className="font-semibold">{page}</span>.
            </div>
          )}

          {searched && results.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold">No live results found</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Try a broader keyword, remove the location, or switch the country code.
              </p>
            </div>
          ) : (
            results.map((job, index) => {
              const isExpanded = expandedIndexes.includes(index);
              const descriptionToShow = isExpanded
                ? job.description
                : truncateText(job.description);

              return (
                <div
                  key={`${job.source_id}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{job.title}</h2>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {job.location || "No location"} •{" "}
                        {job.remote ? "Remote" : "On-site"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white">
                      Live Adzuna
                    </div>
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
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
                          ? `${job.salary_min ?? "-"} - ${job.salary_max ?? "-"}`
                          : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                      <p className="mb-2 font-semibold">Structured skills</p>
                      <p className="text-gray-700">
                        {job.required_skills.length
                          ? job.required_skills.join(", ")
                          : "No structured skills available"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                    <p className="mb-2 font-semibold">Job description</p>
                    <p className="leading-6 text-gray-700">{descriptionToShow}</p>

                    {job.description.length > 260 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(index)}
                        className="mt-3 text-sm font-medium text-blue-600 hover:underline"
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
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Open original job source
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}