type JobSourceBadgeProps = {
  source: string;
  className?: string;
};

function getSourcePresentation(source: string): { label: string; className: string } {
  switch (source) {
    case "demo":
      return {
        label: "Demo",
        className:
          "border border-violet-400/30 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-violet-500/5 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.15)] ring-1 ring-inset ring-violet-400/20",
      };
    case "adzuna":
      return {
        label: "Adzuna",
        className: "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/20",
      };
    case "manual":
      return {
        label: "Manual",
        className: "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/20",
      };
    case "remotive":
      return {
        label: "Remotive",
        className:
          "border border-teal-400/25 bg-teal-500/10 text-teal-200 ring-1 ring-inset ring-teal-400/15",
      };
    case "arbeitnow":
      return {
        label: "Arbeitnow",
        className:
          "border border-sky-400/25 bg-sky-500/10 text-sky-200 ring-1 ring-inset ring-sky-400/15",
      };
    case "jooble":
      return {
        label: "Jooble",
        className:
          "border border-cyan-400/25 bg-cyan-500/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/15",
      };
    default:
      return {
        label: source.charAt(0).toUpperCase() + source.slice(1),
        className:
          "border border-white/10 bg-white/[0.06] text-slate-200 ring-1 ring-inset ring-white/[0.06]",
      };
  }
}

export default function JobSourceBadge({ source, className = "" }: JobSourceBadgeProps) {
  const { label, className: variantClassName } = getSourcePresentation(source);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-2xl px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] ${variantClassName} ${className}`}
    >
      {label}
    </span>
  );
}
