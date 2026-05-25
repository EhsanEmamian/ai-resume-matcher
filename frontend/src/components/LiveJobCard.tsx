"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  MapPin,
  Save,
} from "lucide-react";
import { deriveLiveJobRationale } from "@/lib/liveJobRationale";
import type { ExternalJobItem } from "@/lib/api";

const liveJobCardMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

function truncateText(text: string, maxLength = 260) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

type LiveJobCardProps = {
  job: ExternalJobItem;
  index: number;
  keyword: string;
  profileHints: string[];
  isExpanded: boolean;
  onToggleExpanded: (index: number) => void;
  isSaved: boolean;
  isSaving: boolean;
  savedJobId?: string;
  onSave: (job: ExternalJobItem, index: number) => void;
};

export default function LiveJobCard({
  job,
  index,
  keyword,
  profileHints,
  isExpanded,
  onToggleExpanded,
  isSaved,
  isSaving,
  savedJobId,
  onSave,
}: LiveJobCardProps) {
  const description = job.description ?? "";
  const descriptionToShow = isExpanded
    ? description
    : truncateText(description);

  const rationale = deriveLiveJobRationale({
    keyword,
    title: job.title ?? "",
    description,
    profileHints,
  });

  return (
    <motion.article
      initial={liveJobCardMotion.initial}
      animate={liveJobCardMotion.animate}
      transition={liveJobCardMotion.transition}
      className="group rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-lg shadow-black/10 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {job.source_url ? (
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-2xl font-semibold tracking-tight text-slate-100 transition group-hover:text-blue-200"
            >
              {job.title}
            </a>
          ) : (
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
              {job.title}
            </h2>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness size={15} />
              {job.company}
            </span>

            <span className="inline-flex items-center gap-1">
              <MapPin size={15} />
              {job.location || "No location"}
            </span>

            <span>{job.remote ? "Remote" : "On-site"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-center font-mono text-[11px] text-blue-200">
            {job.source === "arbeitnow"
              ? "Arbeitnow · richer text"
              : job.source === "jooble"
                ? "Jooble · aggregator"
                : "Adzuna · broad reach"}
          </div>

          <button
            type="button"
            onClick={() => onSave(job, index)}
            disabled={isSaved || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={15} />
            {isSaved ? "Saved" : isSaving ? "Saving..." : "Save & Analyze"}
          </button>

          {savedJobId && (
            <Link
              href={`/jobs/${savedJobId}`}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-center text-sm font-medium text-emerald-300 hover:bg-emerald-500/15"
            >
              Saved · View Analysis
            </Link>
          )}
        </div>
      </div>

      {rationale.length > 0 && (
        <div className="mb-4 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-4 text-sm">
          <p className="mb-3 font-semibold text-blue-100">Profile rationale</p>

          <div className="flex flex-wrap gap-2">
            {rationale.map((item) => (
              <span
                key={item}
                className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 text-sm">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
          Job preview
        </p>

        <p className="leading-7 text-slate-300">{descriptionToShow}</p>

        {description.length > 260 && (
          <button
            type="button"
            onClick={() => onToggleExpanded(index)}
            className="mt-3 text-sm font-medium text-[#60A5FA] hover:underline"
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
            className="inline-flex items-center gap-1 text-sm font-medium text-[#60A5FA] hover:underline"
          >
            <ArrowUpRight size={14} />
            View original posting
          </a>
        </div>
      )}
    </motion.article>
  );
}
