"""Enterprise-style explainable matching engine (5-component model)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from app.jobs.models import JobPosting
from app.matching.schemas import ScoreBreakdown
from app.resume.models import ResumeProfile

# Max contribution per component when job data is rich
FULL_WEIGHTS: dict[str, float] = {
    "skill_overlap": 0.45,
    "role_alignment": 0.25,
    "seniority_fit": 0.10,
    "language_fit": 0.10,
    "experience_fit": 0.10,
}

# Softer distribution when job posting metadata is sparse
NEUTRAL_WEIGHTS: dict[str, float] = {
    "skill_overlap": 0.50,
    "role_alignment": 0.30,
    "seniority_fit": 0.05,
    "language_fit": 0.075,
    "experience_fit": 0.075,
}

NEUTRAL_COMPONENT_RATIO = 0.5


@dataclass
class ProfileSnapshot:
    skills: list[str]
    technologies: list[str]
    suggested_roles: list[str]
    languages: list[str]
    seniority_level: str | None
    years_of_experience: int | None


def profile_from_resume(profile: ResumeProfile) -> ProfileSnapshot:
    return ProfileSnapshot(
        skills=list(profile.skills or []),
        technologies=list(profile.technologies or []),
        suggested_roles=list(profile.suggested_roles or []),
        languages=list(profile.languages or []),
        seniority_level=profile.seniority_level,
        years_of_experience=profile.years_of_experience,
    )


def _normalize_tokens(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value and value.strip()}


def _display_tokens(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        cleaned = value.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(cleaned)
    return ordered


def _assess_data_quality(job: JobPosting) -> Literal["full", "minimal"]:
    signals = sum(
        [
            bool(job.required_skills),
            bool(job.required_languages),
            bool((job.experience_requirement or "").strip()),
        ]
    )
    return "full" if signals >= 2 else "minimal"


def _infer_seniority_from_title(title: str) -> str | None:
    title_lower = title.lower()
    if any(term in title_lower for term in ("principal", "staff", "lead", "senior", "sr.")):
        return "senior"
    if any(
        term in title_lower
        for term in ("junior", "jr.", "entry", "graduate", "intern", "trainee")
    ):
        return "junior"
    if "mid" in title_lower:
        return "mid"
    return None


def _parse_years_from_text(text: str) -> int | None:
    if not text or not text.strip():
        return None

    patterns = [
        r"\b(\d+)\+\s*years?\b",
        r"\b(\d+)\s*[-–]\s*(\d+)\s*years?\b",
        r"\b(?:minimum|at\s+least|min\.?)\s+(\d+)\s+years?\b",
        r"\b(\d+)\s+years?\s+(?:of\s+)?experience\b",
        r"\bmindestens\s+(\d+)\s+jahre\b",
        r"\b(\d+)\s+jahre\s+(?:einschlägige\s+)?berufserfahrung\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        if match.lastindex and match.lastindex >= 2 and match.group(2):
            try:
                return int(match.group(2))
            except (TypeError, ValueError):
                pass
        try:
            return int(match.group(1))
        except (TypeError, ValueError):
            continue

    return None


def _seniority_rank(value: str | None) -> int | None:
    if not value:
        return None
    normalized = value.strip().lower()
    if any(term in normalized for term in ("senior", "lead", "principal", "staff")):
        return 3
    if any(term in normalized for term in ("junior", "entry", "intern", "graduate")):
        return 1
    if "mid" in normalized:
        return 2
    return 2


def _neutral_component_score(weight: float) -> float:
    return round(weight * NEUTRAL_COMPONENT_RATIO, 4)


def _score_skill_overlap(
    profile: ProfileSnapshot,
    job: JobPosting,
    weight: float,
    *,
    use_neutral: bool,
) -> tuple[float, list[str], list[str]]:
    profile_items = _normalize_tokens(profile.skills + profile.technologies)
    job_items = _normalize_tokens(job.required_skills)

    if not job_items:
        if use_neutral:
            return _neutral_component_score(weight), [], []
        return 0.0, [], []

    overlap_keys = profile_items & job_items
    matched = sorted(overlap_keys)
    missing = sorted(job_items - profile_items)

    ratio = len(overlap_keys) / len(job_items)
    return round(ratio * weight, 4), matched, missing


def _score_role_alignment(
    profile: ProfileSnapshot,
    job: JobPosting,
    weight: float,
    *,
    use_neutral: bool,
) -> float:
    normalized_roles = _normalize_tokens(profile.suggested_roles)
    title_lower = job.title.strip().lower()

    if not normalized_roles:
        return _neutral_component_score(weight) if use_neutral else 0.0

    for role in normalized_roles:
        pattern = rf"(?<!\w){re.escape(role)}(?!\w)"
        if re.search(pattern, title_lower):
            return round(weight, 4)

    return 0.0


def _score_seniority_fit(
    profile: ProfileSnapshot,
    job: JobPosting,
    weight: float,
    *,
    use_neutral: bool,
) -> tuple[float, str | None]:
    profile_rank = _seniority_rank(profile.seniority_level)
    job_rank = _seniority_rank(
        _infer_seniority_from_title(job.title)
        or _infer_seniority_from_title(job.experience_requirement or "")
    )

    if profile_rank is None or job_rank is None:
        signal = (
            f"Profile seniority: {profile.seniority_level or 'unknown'} · "
            f"Job signal: {_infer_seniority_from_title(job.title) or 'unclear'}"
        )
        if use_neutral:
            return _neutral_component_score(weight), signal
        return 0.0, signal

    gap = abs(profile_rank - job_rank)
    if gap == 0:
        ratio = 1.0
    elif gap == 1:
        ratio = 0.65
    else:
        ratio = 0.25

    signal = (
        f"Profile {profile.seniority_level} vs job seniority "
        f"{_infer_seniority_from_title(job.title) or 'mid-level'} alignment"
    )
    return round(ratio * weight, 4), signal


def _score_language_fit(
    profile: ProfileSnapshot,
    job: JobPosting,
    weight: float,
    *,
    use_neutral: bool,
) -> tuple[float, str | None]:
    profile_langs = _normalize_tokens(profile.languages)
    job_langs = _normalize_tokens(job.required_languages)

    if not job_langs:
        if use_neutral:
            return _neutral_component_score(weight), "No language requirements listed on job"
        return 0.0, "No language requirements listed on job"

    if not profile_langs:
        return 0.0, f"Job expects: {', '.join(_display_tokens(job.required_languages))}"

    overlap = profile_langs & job_langs
    ratio = len(overlap) / len(job_langs)
    signal = (
        f"Languages matched: {', '.join(sorted(overlap))}"
        if overlap
        else f"Job languages not met: {', '.join(sorted(job_langs))}"
    )
    return round(ratio * weight, 4), signal


def _score_experience_fit(
    profile: ProfileSnapshot,
    job: JobPosting,
    weight: float,
    *,
    use_neutral: bool,
) -> tuple[float, str | None]:
    job_years = _parse_years_from_text(job.experience_requirement or "")
    if job_years is None:
        job_years = _parse_years_from_text(job.description or "")

    profile_years = profile.years_of_experience

    if job_years is None:
        if use_neutral:
            return (
                _neutral_component_score(weight),
                "Experience requirement not structured on job posting",
            )
        return 0.0, "Experience requirement not structured on job posting"

    if profile_years is None:
        return 0.0, f"Job asks for ~{job_years}+ years; profile years unknown"

    if profile_years >= job_years:
        ratio = 1.0
    elif profile_years >= job_years - 1:
        ratio = 0.7
    else:
        ratio = max(0.2, profile_years / job_years)

    signal = f"Profile {profile_years}y vs job ~{job_years}y requirement"
    return round(ratio * weight, 4), signal


def generate_match_narrative(
    *,
    breakdown: ScoreBreakdown,
    job: JobPosting,
) -> str:
    parts: list[str] = []

    final_pct = round(breakdown.final_score * 100)
    parts.append(f"Overall fit {final_pct}% for {job.title} at {job.company}.")

    if breakdown.matched_skills:
        skills = ", ".join(breakdown.matched_skills[:6])
        parts.append(f"Skills aligned: {skills}.")

    if breakdown.missing_skills:
        missing = ", ".join(breakdown.missing_skills[:4])
        parts.append(f"Gaps to address: {missing}.")

    if breakdown.seniority_signal:
        parts.append(breakdown.seniority_signal.rstrip(".") + ".")

    if breakdown.language_signal:
        parts.append(breakdown.language_signal.rstrip(".") + ".")

    if breakdown.data_quality == "minimal":
        parts.append(
            "Job posting has limited structured metadata; neutral weighting was applied."
        )
    elif breakdown.role_alignment >= breakdown.weights.get("role_alignment", 0.25) * 0.9:
        parts.append("Role title closely matches the candidate's target roles.")

    return " ".join(parts)


def calculate_match(
    profile: ResumeProfile | ProfileSnapshot,
    job: JobPosting,
) -> tuple[float, str, ScoreBreakdown, list[str]]:
    snapshot = profile if isinstance(profile, ProfileSnapshot) else profile_from_resume(profile)

    data_quality = _assess_data_quality(job)
    use_neutral = data_quality == "minimal"
    weights = NEUTRAL_WEIGHTS if use_neutral else FULL_WEIGHTS

    skill_overlap, matched_keys, missing_keys = _score_skill_overlap(
        snapshot,
        job,
        weights["skill_overlap"],
        use_neutral=use_neutral,
    )
    role_alignment = _score_role_alignment(
        snapshot,
        job,
        weights["role_alignment"],
        use_neutral=use_neutral,
    )
    seniority_fit, seniority_signal = _score_seniority_fit(
        snapshot,
        job,
        weights["seniority_fit"],
        use_neutral=use_neutral,
    )
    language_fit, language_signal = _score_language_fit(
        snapshot,
        job,
        weights["language_fit"],
        use_neutral=use_neutral,
    )
    experience_fit, _experience_signal = _score_experience_fit(
        snapshot,
        job,
        weights["experience_fit"],
        use_neutral=use_neutral,
    )

    final_score = min(
        round(
            skill_overlap
            + role_alignment
            + seniority_fit
            + language_fit
            + experience_fit,
            4,
        ),
        1.0,
    )

    job_skill_display = _display_tokens(job.required_skills)
    matched_skills = [
        skill
        for skill in job_skill_display
        if skill.lower() in matched_keys
    ] or [skill for skill in snapshot.skills + snapshot.technologies if skill.lower() in matched_keys]
    missing_skills = [
        skill
        for skill in job_skill_display
        if skill.lower() in missing_keys
    ]

    breakdown = ScoreBreakdown(
        skill_overlap=skill_overlap,
        role_alignment=role_alignment,
        seniority_fit=seniority_fit,
        language_fit=language_fit,
        experience_fit=experience_fit,
        final_score=final_score,
        weights=weights,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        seniority_signal=seniority_signal,
        language_signal=language_signal,
        data_quality=data_quality,
        narrative="",
    )
    narrative = generate_match_narrative(breakdown=breakdown, job=job)
    breakdown = breakdown.model_copy(update={"narrative": narrative})

    return final_score, narrative, breakdown, matched_skills


def breakdown_to_storage(breakdown: ScoreBreakdown) -> dict:
    return breakdown.model_dump()
