from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.jobs.adzuna_client import fetch_jobs
from app.jobs.models import JobPosting
from app.jobs.skill_extractor import (
    extract_skills_from_text,
    normalize_salary_text_for_storage,
)


@dataclass
class IngestionSummary:
    fetched: int
    created: int
    skipped: int
    errors: int
    keyword: str
    location: str
    country: str


def ingest_adzuna_jobs(
    db: Session,
    keyword: str,
    location: str,
    country: str,
    max_results: int,
) -> IngestionSummary:
    jobs = fetch_jobs(
        keyword=keyword,
        location=location,
        country=country,
        max_results=max_results,
    )

    created = 0
    skipped = 0
    errors = 0

    for job_data in jobs:
        source = job_data.get("source")
        source_id = job_data.get("source_id")

        existing = None
        if source and source_id:
            existing = db.scalar(
                select(JobPosting).where(
                    JobPosting.source == source,
                    JobPosting.source_id == source_id,
                )
            )

        if existing is not None:
            skipped += 1
            continue

        try:
            if not job_data.get("required_skills"):
                job_data["required_skills"] = extract_skills_from_text(
                    title=job_data.get("title", ""),
                    description=job_data.get("description", ""),
                )

            if job_data.get("salary_text"):
                job_data["salary_text"] = normalize_salary_text_for_storage(
                    job_data["salary_text"]
                )

            job = JobPosting(**job_data)
            db.add(job)
            db.commit()
            created += 1
        except IntegrityError:
            db.rollback()
            skipped += 1
        except Exception:
            db.rollback()
            errors += 1

    return IngestionSummary(
        fetched=len(jobs),
        created=created,
        skipped=skipped,
        errors=errors,
        keyword=keyword,
        location=location,
        country=country,
    )