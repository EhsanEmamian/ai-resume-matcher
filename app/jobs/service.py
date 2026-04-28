from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.jobs.models import JobPosting
from app.jobs.schemas import JobPostingCreate
from app.jobs.skill_extractor import extract_skills_from_text


def create_job(db: Session, payload: JobPostingCreate) -> JobPosting:
    job = JobPosting(
        title=payload.title,
        company=payload.company,
        description=payload.description,
        required_skills=payload.required_skills,
        location=payload.location,
        remote=payload.remote,
        posted_at=payload.posted_at,
        source="manual",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def import_external_job(db: Session, payload: dict) -> tuple[str, JobPosting]:
    source = payload.get("source")
    source_id = payload.get("source_id")

    existing = None
    if source and source_id:
        existing = db.scalar(
            select(JobPosting).where(
                JobPosting.source == source,
                JobPosting.source_id == source_id,
            )
        )

    if existing is not None:
        return "already_exists", existing

    extracted_skills = extract_skills_from_text(
        title=payload.get("title", ""),
        description=payload.get("description", ""),
    )

    if not payload.get("required_skills"):
        payload["required_skills"] = extracted_skills

    job = JobPosting(**payload)
    db.add(job)
    db.commit()
    db.refresh(job)
    return "imported", job


def backfill_job_skills(db: Session) -> dict:
    jobs = list(db.scalars(select(JobPosting)).all())

    updated = 0
    skipped = 0

    for job in jobs:
        if job.required_skills:
            skipped += 1
            continue

        extracted_skills = extract_skills_from_text(
            title=job.title or "",
            description=job.description or "",
        )

        if extracted_skills:
            job.required_skills = extracted_skills
            updated += 1
        else:
            skipped += 1

    db.commit()

    return {
        "total": len(jobs),
        "updated": updated,
        "skipped": skipped,
    }


def list_jobs(db: Session, skip: int = 0, limit: int = 20) -> tuple[int, list[JobPosting]]:
    total = db.scalar(select(func.count()).select_from(JobPosting)) or 0

    jobs = list(
        db.scalars(
            select(JobPosting)
            .order_by(JobPosting.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()
    )

    return total, jobs


def get_job(db: Session, job_id) -> JobPosting | None:
    return db.get(JobPosting, job_id)


def delete_job(db: Session, job: JobPosting) -> None:
    db.delete(job)
    db.commit()


def clear_jobs_by_source(db: Session, source: str) -> int:
    stmt = delete(JobPosting).where(JobPosting.source == source)
    result = db.execute(stmt)
    db.commit()
    return result.rowcount or 0