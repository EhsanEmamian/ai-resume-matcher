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
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
              Resume Profile
            </p>
            <h1 className="mt-2 text-3xl font-bold">{data.filename}</h1>
            <p className="mt-2 text-sm text-gray-600">Resume ID: {data.id}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Parsed Profile</h2>

            <div className="space-y-3 text-sm text-gray-800">
              <p>
                <span className="font-semibold">Skills:</span>{" "}
                {data.profile?.skills?.join(", ") || "-"}
              </p>
              <p>
                <span className="font-semibold">Technologies:</span>{" "}
                {data.profile?.technologies?.join(", ") || "-"}
              </p>
              <p>
                <span className="font-semibold">Languages:</span>{" "}
                {data.profile?.languages?.join(", ") || "-"}
              </p>
              <p>
                <span className="font-semibold">Suggested roles:</span>{" "}
                {data.profile?.suggested_roles?.join(", ") || "-"}
              </p>
              <p>
                <span className="font-semibold">Seniority:</span>{" "}
                {data.profile?.seniority_level || "-"}
              </p>
              <p>
                <span className="font-semibold">Years of experience:</span>{" "}
                {data.profile?.years_of_experience ?? "-"}
              </p>
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