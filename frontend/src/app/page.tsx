"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import JobIngestionPanel from "@/components/JobIngestionPanel";
import { uploadAndParseResume } from "@/lib/api";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await uploadAndParseResume(file);
      router.push(`/profile/${data.resume_id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-12">
          <section className="rounded-3xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
              <div>
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                  AI Resume Matcher
                </p>
                <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Turn resume parsing and job matching into a usable workflow
                </h1>
                <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
                  Upload a PDF resume, extract a structured candidate profile,
                  import real jobs from Adzuna, and review explainable job
                  matches with score breakdowns.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/jobs"
                    className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
                  >
                    Browse Jobs
                  </a>
                  <a
                    href="#upload"
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
                  >
                    Upload Resume
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Step 1
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">Import jobs</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Pull real job postings from Adzuna into your local backend.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Step 2
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">Upload resume</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Parse a PDF resume into structured skills, technologies, and
                    suggested roles.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Step 3
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">Review matches</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    See ranked jobs with match reasons, skill overlap, and score
                    breakdown.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Product Focus
              </p>
              <h3 className="mt-2 text-lg font-semibold">Resume parsing</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Extracts structured profile data from uploaded PDF resumes.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Matching Logic
              </p>
              <h3 className="mt-2 text-lg font-semibold">Explainable scoring</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Uses transparent score breakdowns instead of black-box ranking.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Real Data
              </p>
              <h3 className="mt-2 text-lg font-semibold">External job ingestion</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Imports real jobs from Adzuna so the workflow feels closer to a
                real product.
              </p>
            </div>
          </section>

          <section
            id="upload"
            className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                Resume Upload
              </p>
              <h2 className="mt-2 text-2xl font-bold">Upload and parse a resume</h2>
              <p className="mt-2 text-sm text-gray-600">
                Upload a PDF resume and get a structured profile from the backend.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Upload and Parse"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </section>

          <JobIngestionPanel />
        </div>
      </main>
    </>
  );
}