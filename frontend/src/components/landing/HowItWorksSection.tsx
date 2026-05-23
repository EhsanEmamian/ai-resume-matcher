"use client";

import { motion } from "framer-motion";

const staggerGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const steps = [
  {
    number: "01",
    title: "Upload PDF",
    text: "Upload a resume PDF. Invalid or unrelated documents are rejected before profile generation.",
  },
  {
    number: "02",
    title: "Extract Profile",
    text: "Claude AI extracts skills, seniority, experience signals, and candidate preferences into a structured profile.",
  },
  {
    number: "03",
    title: "Match Jobs",
    text: "Saved jobs are scored with visible reasoning, matched skills, and explainable score breakdowns.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="border-t border-white/[0.08] bg-[#0B1120] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-50">
            From resume to explainable job matches.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            The product flow is intentionally simple: parse the resume, build a
            structured profile, then compare it against real job descriptions.
          </p>
        </div>

        <motion.div
          className="mt-10 grid gap-4 md:grid-cols-3"
          variants={staggerGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={staggerItemVariants}
              className="rounded-[1.75rem] border border-white/[0.08] bg-[#111827] p-6 shadow-lg shadow-black/10 ring-1 ring-inset ring-white/[0.04] transition hover:border-blue-400/25 hover:shadow-blue-950/15"
            >
              <p className="font-mono text-xs text-blue-300">{step.number}</p>

              <h3 className="mt-5 text-base font-semibold text-slate-100">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {step.text}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10">
          <a
            href="#try-it"
            className="inline-flex rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
          >
            Upload Your Resume →
          </a>
        </div>
      </div>
    </section>
  );
}