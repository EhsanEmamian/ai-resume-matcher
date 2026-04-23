"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            AI Resume Matcher
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Upload and parse a resume
          </h1>
          <p className="text-base text-gray-600 sm:text-lg">
            Upload a PDF resume and get a structured profile from the backend.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
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
        </div>
      </div>
    </main>
  );
}