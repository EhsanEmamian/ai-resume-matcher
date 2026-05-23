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

const features = [
  {
    eyebrow: "Validation",
    title: "AI Resume Validation",
    text: "The app checks whether an uploaded PDF is actually a resume before extracting profile data, reducing fake or hallucinated candidate profiles.",
  },
  {
    eyebrow: "Scoring",
    title: "Explainable Matching",
    text: "Each job match includes a visible score breakdown, making it clear why a role fits or does not fit the extracted candidate profile.",
  },
  {
    eyebrow: "Discovery",
    title: "Live Job Discovery",
    text: "Search real job postings through Adzuna and Arbeitnow, then save promising roles for deeper enrichment and analysis.",
  },
];

export default function FeatureHighlightsSection() {
  return (
    <section className="border-t border-white/10 bg-[#0F172A] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
              Product features
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
              Built around real backend and AI workflows.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-slate-400">
            The homepage highlights only features that exist in the actual app —
            no fake metrics, no placeholder SaaS fluff.
          </p>
        </div>

        <motion.div
          className="mt-10 grid gap-4 md:grid-cols-3"
          variants={staggerGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={staggerItemVariants}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 transition hover:border-blue-400/30 hover:bg-[#1B2537]"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {feature.eyebrow}
              </p>

              <h3 className="mt-4 text-base font-semibold text-slate-100">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {feature.text}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}