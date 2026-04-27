"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import JobIngestionPanel from "@/components/JobIngestionPanel";
import { uploadAndParseResume } from "@/lib/api";

function FeatureCard({
  eyebrow,
  title,
  text,
  imageSrc,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
      <div className="relative h-48 w-full bg-gray-100">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-gray-600">{text}</p>
      </div>
    </div>
  );
}

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

      <main className="min-h-screen bg-[linear-gradient(to_bottom,#ffffff,#f7f7f7)] text-black">
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
          <section className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <Image
                src="/images/abstract-grid-glow-bg.png"
                alt="Abstract background"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-8 sm:p-10 lg:p-12">
                <div className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-medium text-gray-700">
                  Full-stack product prototype
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Resume parsing, live job search, and explainable matching in one workflow
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                  Upload a PDF resume, extract structured profile data, search live
                  jobs from Adzuna, import selected postings, and review ranked
                  job matches with transparent score breakdowns.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#upload"
                    className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                  >
                    Upload Resume
                  </a>
                  <a
                    href="/live-jobs"
                    className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium transition hover:bg-gray-50"
                  >
                    Search Live Jobs
                  </a>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-black/5 bg-white/80 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Step 1
                    </p>
                    <p className="mt-2 text-sm font-medium">Import or search jobs</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white/80 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Step 2
                    </p>
                    <p className="mt-2 text-sm font-medium">Upload and parse resume</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white/80 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Step 3
                    </p>
                    <p className="mt-2 text-sm font-medium">Review match quality</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[320px] border-t border-black/5 bg-gray-50/80 lg:border-l lg:border-t-0">
                <Image
                  src="/images/hero-dashboard-workflow.png"
                  alt="AI resume matcher dashboard workflow illustration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              eyebrow="Parsing"
              title="Resume to structured profile"
              text="Transform uploaded PDF resumes into a profile containing extracted skills, technologies, and suggested roles."
              imageSrc="/images/feature-resume-parsing.png"
              imageAlt="Resume parsing illustration"
            />
            <FeatureCard
              eyebrow="Search"
              title="Live job discovery"
              text="Search live Adzuna job data directly from the app instead of relying only on manually stored postings."
              imageSrc="/images/feature-live-job-search.png"
              imageAlt="Live job search illustration"
            />
            <FeatureCard
              eyebrow="Matching"
              title="Readable ranking logic"
              text="Review why jobs matched through deterministic scoring, rule-based extraction, and visible score breakdowns."
              imageSrc="/images/feature-explainable-matching.png"
              imageAlt="Explainable matching illustration"
            />
          </section>

          <section
            id="upload"
            className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                Resume Upload
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Upload and parse a resume
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                Upload a PDF resume and generate a structured candidate profile
                that can later be matched against saved jobs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Upload and Parse"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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