import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session, selectinload

from app.jobs.models import JobPosting
from app.matching.models import MatchResult
from app.matching.schemas import MatchResultRead, MatchedJobRead, ProfilePreviewRequest
from app.resume.models import Resume, ResumeProfile

PREVIEW_RESUME_ID = uuid.UUID(int=0)


@dataclass
class _ProfileSnapshot:
    skills: list[str]
    technologies: list[str]
    suggested_roles: list[str]


def _normalize_list(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value and value.strip()}


def _role_overlap_score(suggested_roles: list[str], job_title: str) -> tuple[float, str | None]:
    normalized_roles = _normalize_list(suggested_roles)
    title_lower = job_title.strip().lower()

    for role in normalized_roles:
        # استفاده از رجکس برای اطمینان از اینکه نقش پیشنهادی به عنوان یک کلمه مستقل در عنوان شغل وجود دارد
        escaped_role = re.escape(role)
        pattern = rf"(?<!\w){escaped_role}(?!\w)"
        
        if re.search(pattern, title_lower):
            return 0.3, f"Role alignment: '{job_title}' matches suggested role '{role}'."

    return 0.0, None


def _skills_overlap_score(
    profile_technologies: list[str],
    profile_skills: list[str],
    job_required_skills: list[str],
) -> tuple[float, str, list[str]]:
    profile_items = _normalize_list(profile_technologies + profile_skills)
    job_items = _normalize_list(job_required_skills)

    if not job_items:
        return 0.2, "Job has no required skills listed, so a neutral base score was applied.", []

    overlap = sorted(profile_items & job_items)
    ratio = len(overlap) / len(job_items)
    score = round(ratio * 0.7, 4)

    if overlap:
        reason = f"Matched skills/technologies: {', '.join(overlap)}."
    else:
        reason = "No direct skill overlap found."

    return score, reason, overlap


def _remote_bonus(job: JobPosting) -> tuple[float, str | None]:
    if job.remote:
        return 0.1, "Remote-friendly job bonus applied."
    return 0.0, None


def calculate_match_score(
    profile: ResumeProfile | _ProfileSnapshot,
    job: JobPosting,
) -> tuple[float, str, dict, list[str]]:
    reasons: list[str] = []

    skill_score, skill_reason, matched_skills = _skills_overlap_score(
        profile.technologies,
        profile.skills,
        job.required_skills,
    )
    reasons.append(skill_reason)

    role_score, role_reason = _role_overlap_score(profile.suggested_roles, job.title)
    if role_reason:
        reasons.append(role_reason)

    remote_score, remote_reason = _remote_bonus(job)
    if remote_reason:
        reasons.append(remote_reason)

    final_score = min(round(skill_score + role_score + remote_score, 4), 1.0)

    breakdown = {
        "skill_overlap_score": skill_score,
        "role_overlap_score": role_score,
        "remote_bonus": remote_score,
        "final_score": final_score,
    }

    return final_score, " ".join(reasons), breakdown, matched_skills


def _snapshot_from_preview(payload: ProfilePreviewRequest) -> _ProfileSnapshot:
    skills = [value.strip() for value in payload.skills if value and value.strip()]
    roles = [
        value.strip()
        for value in payload.suggested_roles
        if value and value.strip()
    ]
    seniority = payload.seniority_level.strip().lower()

    expanded_roles = list(dict.fromkeys([*roles, *[f"{seniority} {role}" for role in roles]]))

    return _ProfileSnapshot(
        skills=skills,
        technologies=skills,
        suggested_roles=expanded_roles,
    )


def preview_matches_for_profile(
    db: Session,
    payload: ProfilePreviewRequest,
) -> list[MatchResultRead]:
    profile = _snapshot_from_preview(payload)
    jobs = list(db.scalars(select(JobPosting)).all())
    now = datetime.now(timezone.utc)

    preview_items: list[MatchResultRead] = []

    for job in jobs:
        score, reason, breakdown, matched_skills = calculate_match_score(profile, job)

        preview_items.append(
            MatchResultRead(
                id=uuid.uuid4(),
                resume_id=PREVIEW_RESUME_ID,
                job_id=job.id,
                score=score,
                reason=reason,
                score_breakdown=breakdown,
                matched_skills=matched_skills,
                matched_at=now,
                job=MatchedJobRead.model_validate(job),
            )
        )

    preview_items.sort(key=lambda item: item.score, reverse=True)
    return preview_items


def generate_matches_for_resume(db: Session, resume_id: uuid.UUID) -> list[MatchResult]:
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise ValueError(f"Resume with id '{resume_id}' not found.")

    profile = db.scalar(
        select(ResumeProfile).where(ResumeProfile.resume_id == resume_id)
    )
    if profile is None:
        raise ValueError(f"Resume profile for resume '{resume_id}' not found.")

    jobs = list(db.scalars(select(JobPosting)).all())
    now = datetime.now(timezone.utc)

    for job in jobs:
        score, reason, breakdown, matched_skills = calculate_match_score(profile, job)

        stmt = insert(MatchResult).values(
            resume_id=resume_id,
            job_id=job.id,
            score=score,
            reason=reason,
            score_breakdown=breakdown,
            matched_skills=matched_skills,
            matched_at=now,
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=[MatchResult.resume_id, MatchResult.job_id],
            set_={
                "score": score,
                "reason": reason,
                "score_breakdown": breakdown,
                "matched_skills": matched_skills,
                "matched_at": now,
            },
        )

        db.execute(stmt)

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