import type { ResumeProfile } from "@/lib/api";

export type ProfileSearchSuggestion = {
  label: string;
  keyword: string;
  source: "suggested_role" | "technology" | "seniority_role";
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function deriveSearchSuggestions(
  profile: ResumeProfile | null | undefined
): ProfileSearchSuggestion[] {
  if (!profile) return [];

  const suggestions: ProfileSearchSuggestion[] = [];

  const suggestedRoles = uniqueStrings(profile.suggested_roles || []);
  const technologies = uniqueStrings(profile.technologies || []);
  const seniority = profile.seniority_level?.trim();

  suggestedRoles.slice(0, 2).forEach((role) => {
    suggestions.push({
      label: role,
      keyword: role,
      source: "suggested_role",
    });
  });

  if (technologies.length > 0) {
    suggestions.push({
      label: `${technologies[0]} Developer`,
      keyword: `${technologies[0]} developer`,
      source: "technology",
    });
  }

  if (seniority && suggestedRoles.length > 0) {
    suggestions.push({
      label: `${seniority} ${suggestedRoles[0]}`,
      keyword: `${seniority} ${suggestedRoles[0]}`,
      source: "seniority_role",
    });
  }

  const seen = new Set<string>();
  return suggestions.filter((item) => {
    const key = item.keyword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}