from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.jobs.models import JobPosting
from app.jobs.schemas import JobPostingCreate


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

    job = JobPosting(**payload)
    db.add(job)
    db.commit()
    db.refresh(job)
    return "imported", job


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