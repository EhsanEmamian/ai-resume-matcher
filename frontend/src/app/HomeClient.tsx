"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ApiError, uploadAndParseResume } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeatureHighlightsSection from "@/components/landing/FeatureHighlightsSection";
import TechStackBar from "@/components/landing/TechStackBar";

const tryItEntranceVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function HomeClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidDocument, setInvalidDocument] = useState<{
    message: string;
    documentType?: string;
    confidence?: number;
  } | null>(null);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file.");
      setInvalidDocument(null);
      return;
    }

    setLoading(true);
    setError("");
    setInvalidDocument(null);

    try {
      const data = await uploadAndParseResume(file);
      router.push(`/profile/${data.resume_id}`);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 422 && err.detail) {
        const detail = err.detail as {
          message?: string;
          document_type?: string;
          confidence?: number;
        };

        setInvalidDocument({
          message:
            detail.message ||
            "This document does not look like a resume or CV. Please upload a valid resume PDF.",
          documentType: detail.document_type,
          confidence: detail.confidence,
        });
        setError("");
      } else {
        setError(err.message || "Something went wrong.");
        setInvalidDocument(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] text-slate-100">
        <HeroSection />

        <section
          id="try-it"
          className="scroll-mt-24 border-t border-white/10 bg-[#0B1120] px-6 py-20"
        >
          <motion.div
            className="mx-auto max-w-4xl"
            variants={tryItEntranceVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <div className="mb-8 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
                Try it
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                Upload and parse a resume.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Upload a PDF resume and generate a structured candidate profile
                that can later be matched against saved jobs.
              </p>

              <p className="mt-3 font-mono text-xs text-slate-500">
                PDF only · AI validated · No account required
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-2xl shadow-black/20 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">
                    Resume PDF
                  </span>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setInvalidDocument(null);
                      setError("");
                    }}
                    className="block w-full cursor-pointer rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-400/40"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-6 text-slate-500">
                    The backend validates the document before creating a profile.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Uploading..." : "Upload and Parse →"}
                  </button>
                </div>
              </form>

              {invalidDocument && (
                <div className="mt-5">
                  <AlertBanner variant="error">
                    <div className="space-y-2">
                      <p className="font-medium">
                        This document does not appear to be a valid resume or CV.
                      </p>

                      {invalidDocument.documentType && (
                        <p>
                          <span className="font-medium">Detected type:</span>{" "}
                          {invalidDocument.documentType}
                        </p>
                      )}

                      <p>{invalidDocument.message}</p>

                      {typeof invalidDocument.confidence === "number" && (
                        <p className="text-xs opacity-80">
                          Confidence:{" "}
                          {Math.round(invalidDocument.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </AlertBanner>
                </div>
              )}

              {error && (
                <div className="mt-5">
                  <AlertBanner variant="error">{error}</AlertBanner>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <HowItWorksSection />
        <FeatureHighlightsSection />
        <TechStackBar />
      </main>

      <Footer />
    </>
  );
}