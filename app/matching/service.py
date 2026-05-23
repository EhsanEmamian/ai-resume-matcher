import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session, selectinload

from app.jobs.models import JobPosting
from app.matching.models import MatchResult
from app.matching.schemas import MatchResultRead, MatchedJobRead, ProfilePreviewRequest
from app.matching.scorer import (
    ProfileSnapshot,
    breakdown_to_storage,
    calculate_match,
)
from app.resume.models import Resume, ResumeProfile

PREVIEW_RESUME_ID = uuid.UUID(int=0)
REASON_MAX_LENGTH = 500


def _truncate_reason(text: str) -> str:
    if len(text) <= REASON_MAX_LENGTH:
        return text
    return text[: REASON_MAX_LENGTH - 3].rstrip() + "..."


def _snapshot_from_preview(payload: ProfilePreviewRequest) -> ProfileSnapshot:
    skills = [value.strip() for value in payload.skills if value and value.strip()]
    roles = [
        value.strip()
        for value in payload.suggested_roles
        if value and value.strip()
    ]
    seniority = payload.seniority_level.strip().lower()

    expanded_roles = list(dict.fromkeys([*roles, *[f"{seniority} {role}" for role in roles]]))

    return ProfileSnapshot(
        skills=skills,
        technologies=skills,
        suggested_roles=expanded_roles,
        languages=[],
        seniority_level=seniority,
        years_of_experience=None,
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
        score, narrative, breakdown, matched_skills = calculate_match(profile, job)

        preview_items.append(
            MatchResultRead(
                id=uuid.uuid4(),
                resume_id=PREVIEW_RESUME_ID,
                job_id=job.id,
                score=score,
                reason=narrative,
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
        score, narrative, breakdown, matched_skills = calculate_match(profile, job)
        reason = _truncate_reason(narrative)
        breakdown_payload = breakdown_to_storage(breakdown)

        stmt = insert(MatchResult).values(
            resume_id=resume_id,
            job_id=job.id,
            score=score,
            reason=reason,
            score_breakdown=breakdown_payload,
            matched_skills=matched_skills,
            matched_at=now,
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=[MatchResult.resume_id, MatchResult.job_id],
            set_={
                "score": score,
                "reason": reason,
                "score_breakdown": breakdown_payload,
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
