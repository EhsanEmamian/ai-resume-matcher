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
    <section className="border-t border-white/10 bg-[#0B1120] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
            From resume to explainable job matches.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            The product flow is intentionally simple: parse the resume, build a
            structured profile, then compare it against real job descriptions.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 transition hover:border-blue-400/30"
            >
              <p className="font-mono text-xs text-blue-300">{step.number}</p>

              <h3 className="mt-5 text-base font-semibold text-slate-100">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>

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