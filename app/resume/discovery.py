import logging
import uuid

from app.database import SessionLocal
from app.jobs.adzuna_client import fetch_jobs
from app.jobs import service as jobs_service
from app.matching import service as matching_service
from app.resume.models import Resume, ResumeProfile

logger = logging.getLogger(__name__)

DISCOVERY_JOB_LIMIT = 8
DEFAULT_DISCOVERY_KEYWORD = "software"


def _pick_discovery_keyword(profile: ResumeProfile) -> str:
    """Use the top suggested role, then top skill, then top technology."""
    if profile.suggested_roles:
        keyword = profile.suggested_roles[0].strip()
        if keyword:
            return keyword

    for skill in profile.skills:
        keyword = skill.strip()
        if keyword:
            return keyword

    for technology in profile.technologies:
        keyword = technology.strip()
        if keyword:
            return keyword

    return DEFAULT_DISCOVERY_KEYWORD


def _fetch_live_jobs(keyword: str) -> list[dict]:
    """Fetch a small batch from Remotive, falling back to Adzuna when needed."""
    jobs = jobs_service.fetch_remotive_jobs(keyword=keyword, limit=DISCOVERY_JOB_LIMIT)
    if jobs:
        return jobs

    logger.info(
        "Remotive returned no jobs for keyword=%r; falling back to Adzuna",
        keyword,
    )
    return fetch_jobs(
        keyword=keyword,
        location="",
        country="us",
        max_results=DISCOVERY_JOB_LIMIT,
    )


def _import_jobs(db, job_payloads: list[dict]) -> int:
    imported = 0
    for payload in job_payloads:
        status_value, _job, _enqueue_enrichment = jobs_service.import_external_job(
            db,
            payload,
        )
        if status_value == "imported":
            imported += 1
    return imported


def _set_discovery_status(
    db,
    resume_id: uuid.UUID,
    *,
    status: str,
    job_count: int | None = None,
) -> None:
    resume = db.get(Resume, resume_id)
    if resume is None:
        return

    resume.discovery_status = status
    if job_count is not None:
        resume.discovery_job_count = job_count
    db.commit()


def run_auto_discovery(resume_id: uuid.UUID, profile: ResumeProfile) -> None:
    """
    Background task: discover live jobs for a parsed resume, import them,
    generate match results, and update discovery status on the resume row.
    """
    db = SessionLocal()
    try:
        resume = db.get(Resume, resume_id)
        if resume is None:
            logger.error("Auto-discovery skipped: resume %s not found", resume_id)
            return

        resume.discovery_status = "processing"
        db.commit()

        keyword = _pick_discovery_keyword(profile)
        job_payloads = _fetch_live_jobs(keyword)
        imported_count = _import_jobs(db, job_payloads)

        matching_service.generate_matches_for_resume(db, resume_id)

        resume = db.get(Resume, resume_id)
        if resume is not None:
            resume.discovery_status = "ready"
            resume.discovery_job_count = imported_count
            db.commit()

        logger.info(
            "Auto-discovery completed for resume_id=%s keyword=%r imported=%s",
            resume_id,
            keyword,
            imported_count,
        )
    except Exception:
        logger.exception("Auto-discovery failed for resume_id=%s", resume_id)
        db.rollback()
        try:
            _set_discovery_status(db, resume_id, status="failed")
        except Exception:
            logger.exception(
                "Failed to persist discovery failure status for resume_id=%s",
                resume_id,
            )
    finally:
        db.close()
