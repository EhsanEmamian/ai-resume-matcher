"use client";

import type {
  ManualProfileRole,
  ManualProfileSeniority,
} from "@/lib/api";

const fieldClassName =
  "block w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-slate-100 outline-none transition hover:border-white/20 focus:border-blue-400/50";

export const QUICK_MATCH_ROLES: ManualProfileRole[] = [
  "Backend",
  "Frontend",
  "Full Stack",
  "Data",
  "AI",
];

export const QUICK_MATCH_SKILLS = [
  "Python",
  "FastAPI",
  "PostgreSQL",
  "Docker",
  "Next.js",
  "TypeScript",
  "React",
  "Java",
  "AWS",
  "Kubernetes",
  "Redis",
  "SQL",
  "Git",
  "REST APIs",
  "GraphQL",
] as const;

export const QUICK_MATCH_SENIORITIES: ManualProfileSeniority[] = [
  "Junior",
  "Mid",
  "Senior",
];

type QuickMatchFormProps = {
  role: ManualProfileRole;
  onRoleChange: (value: ManualProfileRole) => void;
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  seniority: ManualProfileSeniority;
  onSeniorityChange: (value: ManualProfileSeniority) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export default function QuickMatchForm({
  role,
  onRoleChange,
  skills,
  onSkillsChange,
  seniority,
  onSeniorityChange,
  loading,
  onSubmit,
}: QuickMatchFormProps) {
  function toggleSkill(skill: string) {
    if (skills.includes(skill)) {
      onSkillsChange(skills.filter((item) => item !== skill));
      return;
    }
    onSkillsChange([...skills, skill]);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as ManualProfileRole)}
          className={fieldClassName}
        >
          {QUICK_MATCH_ROLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Skills
        </label>
        <p className="mb-3 text-xs text-slate-500">
          Select at least one technology. Matches use overlap with job required
          skills.
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_MATCH_SKILLS.map((skill) => {
            const selected = skills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition ${
                  selected
                    ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
                    : "border-white/10 bg-[#0F172A] text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 block text-sm font-medium text-slate-200">
          Seniority
        </legend>
        <div className="flex flex-wrap gap-3">
          {QUICK_MATCH_SENIORITIES.map((option) => (
            <label
              key={option}
              className={`cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                seniority === option
                  ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
                  : "border-white/10 bg-[#0F172A] text-slate-300 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="seniority"
                value={option}
                checked={seniority === option}
                onChange={() => onSeniorityChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading || skills.length === 0}
        className="w-full rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Matching..." : "Run Quick Match →"}
      </button>
    </form>
  );
}
