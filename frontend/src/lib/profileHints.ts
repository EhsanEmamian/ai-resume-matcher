import type { ResumeProfile } from "@/lib/api";

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function buildProfileHints(profile: ResumeProfile | null | undefined): string[] {
  if (!profile) return [];

  const items = [
    ...(profile.technologies || []),
    ...(profile.skills || []),
    ...(profile.suggested_roles || []),
  ];

  return unique(items).slice(0, 8);
}