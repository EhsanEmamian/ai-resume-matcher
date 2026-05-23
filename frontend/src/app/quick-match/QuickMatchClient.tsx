"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import QuickMatchForm from "@/components/QuickMatchForm";
import MatchResultsList from "@/components/MatchResultsList";
import {
  previewMatches,
  type ManualProfileRole,
  type ManualProfileSeniority,
  type MatchItem,
} from "@/lib/api";
import { saveHeroState } from "@/lib/heroState";
import { buildManualProfilePayload } from "@/lib/manualProfile";

export default function QuickMatchClient() {
  const [role, setRole] = useState<ManualProfileRole>("Backend");
  const [skills, setSkills] = useState<string[]>(["Python", "FastAPI", "PostgreSQL"]);
  const [seniority, setSeniority] = useState<ManualProfileSeniority>("Mid");
  const [matches, setMatches] = useState<MatchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (skills.length === 0) {
      setError("Select at least one skill.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = buildManualProfilePayload(role, skills, seniority);
      const result = await previewMatches(payload);

      saveHeroState({
        type: "quick_try",
        topRole: `${seniority} ${role}`,
        topSkills: skills.slice(0, 5),
        matchCount: result.items.length,
      });

      setMatches(result.items);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to preview matches.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const manualProfileBanner = (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
      ⚡ Match based on manual profile.{" "}
      <Link href="/#try-it" className="font-medium underline underline-offset-4">
        Upload a real PDF resume
      </Link>{" "}
      for full AI-powered analysis.
    </div>
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
              Quick Try
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Manual profile builder
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              No resume handy? Build a lightweight candidate profile and run the
              same matching engine against your saved jobs — nothing is written to
              the database.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-[#0F172A] p-6">
              <QuickMatchForm
                role={role}
                onRoleChange={setRole}
                skills={skills}
                onSkillsChange={setSkills}
                seniority={seniority}
                onSeniorityChange={setSeniority}
                loading={loading}
                onSubmit={handleSubmit}
              />
            </div>

            {error && (
              <div className="mt-5">
                <AlertBanner variant="error">{error}</AlertBanner>
              </div>
            )}
          </section>

          {matches !== null && (
            <MatchResultsList matches={matches} topBanner={manualProfileBanner} />
          )}

          {matches !== null && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMatches(null)}
                className="rounded-2xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-200"
              >
                Edit profile
              </button>
              <Link
                href="/jobs"
                className="rounded-2xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-200"
              >
                Browse saved jobs
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
