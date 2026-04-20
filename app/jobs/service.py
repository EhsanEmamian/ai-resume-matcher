import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.jobs.models import JobPosting
from app.jobs.schemas import JobPostingCreate


def create_job(db: Session, data: JobPostingCreate) -> JobPosting:
    job = JobPosting(
        title=data.title,
        company=data.company,
        description=data.description,
        required_skills=data.required_skills,
        location=data.location,
        remote=data.remote,
        posted_at=data.posted_at,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, job_id: uuid.UUID) -> JobPosting | None:
    return db.get(JobPosting, job_id)


def list_jobs(db: Session, skip: int = 0, limit: int = 20) -> tuple[int, list[JobPosting]]:
    total = db.scalar(select(func.count()).select_from(JobPosting))
    jobs = db.scalars(
        select(JobPosting)
        .order_by(JobPosting.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return total, list(jobs)


def delete_job(db: Session, job: JobPosting) -> None:
    db.delete(job)
    db.commit()