from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.jobs.models import JobPosting
from app.jobs.schemas import JobPostingCreate
from app.jobs.source_enricher import fetch_source_text_result
from app.jobs.skill_extractor import (
    extract_experience_requirement_from_text,
    extract_languages_from_text,
    extract_salary_text_from_text,
    extract_skills_from_text,
)


def create_job(db: Session, payload: JobPostingCreate) -> JobPosting:
    job = JobPosting(
        title=payload.title,
        company=payload.company,
        description=payload.description,
        required_skills=payload.required_skills,
        required_languages=payload.required_languages,
        experience_requirement=payload.experience_requirement,
        salary_text=payload.salary_text,
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

    title = payload.get("title", "")
    description = payload.get("description", "")
    source_url = payload.get("source_url")

    source_text = None
    enrichment_status = "not_attempted"
    enrichment_error = None
    enrichment_failure_reason = None
    enrichment_result = None

    if source_url:
        enrichment_result = fetch_source_text_result(source_url)
        source_text = enrichment_result.text
        enrichment_status = enrichment_result.status
        enrichment_error = enrichment_result.error
        enrichment_failure_reason = enrichment_result.failure_reason
    else:
        enrichment_failure_reason = "no_url"

    extraction_text = source_text or description

    extracted_skills = extract_skills_from_text(
        title=title,
        description=extraction_text,
    )
    extracted_languages = extract_languages_from_text(
        title=title,
        description=extraction_text,
    )
    extracted_experience = extract_experience_requirement_from_text(
        title=title,
        description=extraction_text,
    )
    extracted_salary_text = extract_salary_text_from_text(
        title=title,
        description=extraction_text,
    )

    if source_text and not payload.get("source_text"):
        payload["source_text"] = source_text

    if not payload.get("enrichment_status"):
        payload["enrichment_status"] = enrichment_status

    if enrichment_error and not payload.get("enrichment_error"):
        payload["enrichment_error"] = enrichment_error

    if enrichment_failure_reason and not payload.get("enrichment_failure_reason"):
        payload["enrichment_failure_reason"] = enrichment_failure_reason

    if payload.get("enrichment_raw_html_length") is None:
        payload["enrichment_raw_html_length"] = (
            enrichment_result.raw_html_length if source_url and enrichment_result else None
        )

    if payload.get("enrichment_text_word_count") is None:
        payload["enrichment_text_word_count"] = (
            enrichment_result.text_word_count if source_url and enrichment_result else None
        )

    if payload.get("enrichment_text_preview") is None:
        payload["enrichment_text_preview"] = (
            enrichment_result.text_preview if source_url and enrichment_result else None
        )

    if not payload.get("required_skills"):
        payload["required_skills"] = extracted_skills

    if not payload.get("required_languages"):
        payload["required_languages"] = extracted_languages

    if not payload.get("experience_requirement"):
        payload["experience_requirement"] = extracted_experience

    if not payload.get("salary_text"):
        payload["salary_text"] = extracted_salary_text

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

        extraction_text = job.source_text or job.description or ""

        extracted_skills = extract_skills_from_text(
            title=job.title or "",
            description=extraction_text,
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


def list_jobs(
    db: Session,
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[JobPosting]]:
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