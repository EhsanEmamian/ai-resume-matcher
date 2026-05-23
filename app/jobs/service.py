import logging
import uuid
from datetime import datetime
from typing import Any, Literal

import httpx

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.jobs.models import JobPosting
from app.jobs.schemas import JobPostingCreate
from app.jobs.source_enricher import fetch_source_text_result
from app.jobs.skill_extractor import (
    extract_experience_requirement_from_text,
    extract_languages_from_text,
    extract_salary_text_from_text,
    extract_skills_from_text,
)

logger = logging.getLogger(__name__)

JobSource = Literal["adzuna", "arbeitnow", "jooble", "remotive"]
DEFAULT_BROWSE_KEYWORD = "software"


def _parse_remotive_posted_at(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def _normalize_remotive_job(item: dict[str, Any]) -> dict[str, Any]:
    """Map a Remotive API job to every field required by ExternalJobRead."""
    title = (item.get("title") or "").strip() or "Untitled Job"
    company = (item.get("company_name") or "").strip() or "Unknown Company"
    description = item.get("description") or ""

    extracted_skills = extract_skills_from_text(title=title, description=description)
    extracted_languages = extract_languages_from_text(title=title, description=description)
    extracted_experience = extract_experience_requirement_from_text(
        title=title,
        description=description,
    )
    extracted_salary_text = extract_salary_text_from_text(
        title=title,
        description=description,
    )

    remotive_salary = (item.get("salary") or "").strip()
    salary_text = remotive_salary or extracted_salary_text

    location_raw = item.get("candidate_required_location")
    location = (location_raw or "").strip() or None

    job_id = item.get("id")
    source_url = (item.get("url") or "").strip() or None

    return {
        "title": title,
        "company": company,
        "description": description,
        "required_skills": extracted_skills,
        "required_languages": extracted_languages,
        "experience_requirement": extracted_experience,
        "salary_text": salary_text,
        "source_text": description or None,
        "enrichment_status": "success" if description else "not_attempted",
        "enrichment_error": None,
        "enrichment_failure_reason": None,
        "enrichment_raw_html_length": len(description) if description else None,
        "enrichment_text_word_count": len(description.split()) if description else None,
        "enrichment_text_preview": description[:300] if description else None,
        "location": location,
        "remote": True,
        "source": "remotive",
        "source_id": str(job_id) if job_id is not None else None,
        "source_url": source_url,
        "salary_min": None,
        "salary_max": None,
        "contract_type": (item.get("job_type") or "").strip() or None,
        "category": (item.get("category") or "").strip() or None,
        "posted_at": _parse_remotive_posted_at(item.get("publication_date")),
    }


def fetch_remotive_jobs(keyword: str, limit: int = 20) -> list[dict]:
    """Fetch jobs from Remotive API and map them to ExternalJobRead."""
    url = "https://remotive.com/api/remote-jobs"
    params = {"limit": limit}
    if keyword:
        params["search"] = keyword

    try:
        response = httpx.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

        jobs = []
        for item in data.get("jobs", [])[:limit]:
            if isinstance(item, dict):
                jobs.append(_normalize_remotive_job(item))
        return jobs
    except Exception as e:
        logger.error("Failed to fetch from Remotive: %s", e)
        return []


def normalize_live_search_keyword(keyword: str | None) -> str:
    """Trim user input; empty string means browse without a specific role keyword."""
    if keyword is None:
        return ""
    return keyword.strip()


def resolve_provider_search_keyword(
    keyword: str | None,
    *,
    source: JobSource,
) -> str:
    """
    Map an optional browse keyword to what each provider accepts.

    Arbeitnow is filtered client-side and can omit keyword matching when empty.
    Adzuna and Jooble require a non-empty query, so we use a broad fallback term.
    """
    cleaned = normalize_live_search_keyword(keyword)
    if cleaned:
        return cleaned
    if source == "arbeitnow":
        return ""
    return DEFAULT_BROWSE_KEYWORD


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


def _find_existing_external_job(
    db: Session,
    source: str | None,
    source_id: str | None,
) -> JobPosting | None:
    if not source or not source_id:
        return None

    return db.scalar(
        select(JobPosting).where(
            JobPosting.source == source,
            JobPosting.source_id == source_id,
        )
    )


def _prepare_immediate_import_payload(payload: dict) -> dict:
    immediate = {**payload}
    immediate.setdefault("required_skills", [])
    immediate.setdefault("required_languages", [])

    if not immediate.get("enrichment_status"):
        immediate["enrichment_status"] = (
            "processing" if immediate.get("source_url") else "pending"
        )

    return immediate


def import_external_job(db: Session, payload: dict) -> tuple[str, JobPosting, bool]:
    source = payload.get("source")
    source_id = payload.get("source_id")

    existing = _find_existing_external_job(db, source, source_id)
    if existing is not None:
        return "already_exists", existing, False

    immediate_payload = _prepare_immediate_import_payload(payload)
    job = JobPosting(**immediate_payload)
    db.add(job)
    db.commit()
    db.refresh(job)
    return "imported", job, True


def enrich_job_background(job_id: uuid.UUID, payload: dict) -> None:
    db = SessionLocal()
    try:
        _enrich_job_background(db, job_id, payload)
    except Exception:
        logger.exception("Background job enrichment failed for job_id=%s", job_id)
        db.rollback()
        job = db.get(JobPosting, job_id)
        if job is not None:
            job.enrichment_status = "failed"
            job.enrichment_error = "Background enrichment failed unexpectedly."
            db.commit()
    finally:
        db.close()


def _enrich_job_background(db: Session, job_id: uuid.UUID, payload: dict) -> None:
    job = db.get(JobPosting, job_id)
    if job is None:
        return

    title = payload.get("title", job.title) or ""
    description = payload.get("description", job.description) or ""
    source_url = payload.get("source_url", job.source_url)

    source_text = None
    enrichment_status = "not_attempted"
    enrichment_error = None
    enrichment_failure_reason = None
    enrichment_result = None

    if source_url:
        enrichment_result = fetch_source_text_result(source_url)
        if enrichment_result.failure_reason == "redirect_interstitial":
            source_text = description
            enrichment_status = "success"
            enrichment_error = None
            enrichment_failure_reason = "redirect_fallback"
        else:
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

    if source_text:
        job.source_text = source_text

    job.enrichment_status = enrichment_status
    job.enrichment_error = enrichment_error
    job.enrichment_failure_reason = enrichment_failure_reason

    if enrichment_result is not None:
        job.enrichment_raw_html_length = enrichment_result.raw_html_length
        job.enrichment_text_word_count = enrichment_result.text_word_count
        job.enrichment_text_preview = enrichment_result.text_preview

    if not payload.get("required_skills") and extracted_skills:
        job.required_skills = extracted_skills

    if not payload.get("required_languages") and extracted_languages:
        job.required_languages = extracted_languages

    if not payload.get("experience_requirement") and extracted_experience:
        job.experience_requirement = extracted_experience

    if not payload.get("salary_text") and extracted_salary_text:
        job.salary_text = extracted_salary_text

    db.commit()


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
