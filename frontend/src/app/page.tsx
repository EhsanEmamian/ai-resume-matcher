"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-sm">
      <div className="relative h-48 w-full bg-[#0f172a]">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-100">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
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

      <main className="min-h-screen bg-[#0B1120] text-slate-100">
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172a] shadow-sm">
            <div className="pointer-events-none absolute inset-0 opacity-10">
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
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
                  Full-stack portfolio product
                </div>

                <p className="mt-6 text-sm font-medium text-slate-400">
                  A portfolio project by{" "}
                  <span className="text-slate-100">Ehsan Emamian</span> — backend
                  engineer,{" "}
                  <span className="text-[#3B82F6]">AI integration builder</span>
                </p>

                <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Resume intelligence, built from scratch.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Upload a PDF resume, extract a structured skill profile using
                  Claude AI, and match against real job postings — with full score
                  breakdowns and explainable results.
                </p>

                <p className="mt-4 font-mono text-xs tracking-wide text-slate-400">
                  FastAPI · PostgreSQL · Next.js · Claude AI · Live Adzuna job data
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#upload"
                    className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#2563EB]"
                  >
                    Upload Resume
                  </a>
                  <a
                    href="/live-jobs"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                  >
                    Search Live Jobs
                  </a>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Step 1
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      Import or search jobs
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Step 2
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      Upload and parse resume
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Step 3
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      Review match quality
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[320px] border-t border-white/10 bg-[#111827] lg:border-l lg:border-t-0">
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
            className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Resume Upload
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">
                Upload and parse a resume
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Upload a PDF resume and generate a structured candidate profile
                that can later be matched against saved jobs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-slate-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Upload and Parse"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </section>

          <JobIngestionPanel />
        </div>
      </main>

      <Footer />
    </>
  );
}