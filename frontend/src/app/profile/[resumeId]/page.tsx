"use client";

import { use, useEffect, useState } from "react";
import Header from "@/components/Header";
import { getResumeFull, type ResumeFullResponse } from "@/lib/api";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = use(params);

  const [data, setData] = useState<ResumeFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResume() {
      try {
        const result = await getResumeFull(resumeId);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchResume();
  }, [resumeId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="p-8">Loading profile...</main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="p-8 text-red-600">{error}</main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className="p-8">No data found.</main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Resume Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold">{data.filename}</h1>
              <p className="mt-2 text-sm text-gray-600">Resume ID: {data.id}</p>
            </div>

            <div className="rounded-2xl bg-black px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-wide text-gray-300">
                Current Matches
              </p>
              <p className="text-2xl font-bold">{data.matches.length}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Parsed Profile</h2>

              <div className="space-y-4 text-sm text-gray-800">
                <div>
                  <p className="mb-1 font-semibold">Skills</p>
                  <p>{data.profile?.skills?.join(", ") || "-"}</p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Technologies</p>
                  <p>{data.profile?.technologies?.join(", ") || "-"}</p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Languages</p>
                  <p>{data.profile?.languages?.join(", ") || "-"}</p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Suggested roles</p>
                  <p>{data.profile?.suggested_roles?.join(", ") || "-"}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-semibold">Seniority</p>
                    <p>{data.profile?.seniority_level || "-"}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-semibold">Years of experience</p>
                    <p>{data.profile?.years_of_experience ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Extracted Resume Text</h2>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
                {data.raw_text || "No raw text available."}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={`/matches/${data.id}`}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
            >
              View Matches
            </a>
            <a
              href="/"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              Upload Another Resume
            </a>
          </div>
        </div>
      </main>
    </>
  );
}