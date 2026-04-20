import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.jobs.models import JobPosting
from app.matching.models import MatchResult
from app.resume.models import Resume, ResumeProfile


def _normalize_list(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value and value.strip()}


def _role_overlap_score(suggested_roles: list[str], job_title: str) -> tuple[float, str | None]:
    normalized_roles = _normalize_list(suggested_roles)
    title = job_title.strip().lower()

    for role in normalized_roles:
        if role in title or title in role:
            return 0.3, f"Role alignment: '{job_title}' matches suggested role '{role}'."

    return 0.0, None


def _skills_overlap_score(
    profile_technologies: list[str],
    profile_skills: list[str],
    job_required_skills: list[str],
) -> tuple[float, str]:
    profile_items = _normalize_list(profile_technologies + profile_skills)
    job_items = _normalize_list(job_required_skills)

    if not job_items:
        return 0.2, "Job has no required skills listed, so a neutral base score was applied."

    overlap = profile_items & job_items
    ratio = len(overlap) / len(job_items)

    score = round(ratio * 0.7, 4)

    if overlap:
        overlap_text = ", ".join(sorted(overlap))
        reason = f"Matched skills/technologies: {overlap_text}."
    else:
        reason = "No direct skill overlap found."

    return score, reason


def _remote_bonus(job: JobPosting) -> tuple[float, str | None]:
    if job.remote:
        return 0.1, "Remote-friendly job bonus applied."
    return 0.0, None


def calculate_match_score(profile: ResumeProfile, job: JobPosting) -> tuple[float, str]:
    total_score = 0.0
    reasons: list[str] = []

    skills_score, skills_reason = _skills_overlap_score(
        profile.technologies,
        profile.skills,
        job.required_skills,
    )
    total_score += skills_score
    reasons.append(skills_reason)

    role_score, role_reason = _role_overlap_score(profile.suggested_roles, job.title)
    total_score += role_score
    if role_reason:
        reasons.append(role_reason)

    remote_score, remote_reason = _remote_bonus(job)
    total_score += remote_score
    if remote_reason:
        reasons.append(remote_reason)

    total_score = min(round(total_score, 4), 1.0)

    return total_score, " ".join(reasons)


def generate_matches_for_resume(db: Session, resume_id: uuid.UUID) -> list[MatchResult]:
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise ValueError(f"Resume with id '{resume_id}' not found.")

    profile = db.scalar(
        select(ResumeProfile).where(ResumeProfile.resume_id == resume_id)
    )
    if profile is None:
        raise ValueError(f"Resume profile for resume '{resume_id}' not found.")

    jobs = db.scalars(select(JobPosting)).all()

    db.execute(delete(MatchResult).where(MatchResult.resume_id == resume_id))

    for job in jobs:
        score, reason = calculate_match_score(profile, job)

        match = MatchResult(
            resume_id=resume_id,
            job_id=job.id,
            score=score,
            reason=reason,
            matched_at=datetime.now(timezone.utc),
        )
        db.add(match)

    db.commit()

    stmt = (
        select(MatchResult)
        .options(selectinload(MatchResult.job))
        .where(MatchResult.resume_id == resume_id)
        .order_by(MatchResult.score.desc(), MatchResult.matched_at.desc())
    )
    return list(db.scalars(stmt).all())


def list_matches_for_resume(
    db: Session,
    resume_id: uuid.UUID,
    min_score: float = 0.0,
    sort_by: str = "score",
) -> tuple[int, list[MatchResult]]:
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise ValueError(f"Resume with id '{resume_id}' not found.")

    stmt = (
        select(MatchResult)
        .options(selectinload(MatchResult.job))
        .where(
            MatchResult.resume_id == resume_id,
            MatchResult.score >= min_score,
        )
    )

    if sort_by == "matched_at":
        stmt = stmt.order_by(MatchResult.matched_at.desc())
    else:
        stmt = stmt.order_by(MatchResult.score.desc(), MatchResult.matched_at.desc())

    items = db.scalars(stmt).all()
    return len(items), list(items)