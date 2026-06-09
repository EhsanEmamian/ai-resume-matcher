import uuid
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.admin_guard import require_admin_key
from app.database import get_db
from app.exceptions import NotFoundError
from app.jobs import ingestion, service
from app.jobs.demo_data import DEMO_JOBS
from app.jobs.models import JobPosting
from app.jobs.base_client import get_job_client
from app.jobs.schemas import (
    BackfillJobSkillsResult,
    ClearJobsBySourceResult,
    ExternalJobRead,
    ExternalJobSearchRequest,
    ExternalJobSearchResult,
    ImportExternalJobRequest,
    ImportExternalJobResult,
    IngestJobsRequest,
    IngestJobsResult,
    JobPostingCreate,
    JobPostingList,
    JobPostingRead,
    SeedDemoResult,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/",
    response_model=JobPostingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a job posting",
)
def create_job(
    payload: JobPostingCreate,
    db: Session = Depends(get_db),
) -> JobPostingRead:
    job = service.create_job(db, payload)
    return job


@router.post(
    "/import-external",
    response_model=ImportExternalJobResult,
    status_code=status.HTTP_200_OK,
    summary="Import a single external job into local storage",
)
def import_external_job(
    payload: ImportExternalJobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> ImportExternalJobResult:
    payload_data = payload.model_dump()
    status_value, job, enqueue_enrichment = service.import_external_job(
        db, payload_data
    )

    if enqueue_enrichment:
        background_tasks.add_task(
            service.enrich_job_background,
            job.id,
            payload_data,
        )

    return ImportExternalJobResult(status=status_value, job=job)


@router.post(
    "/backfill-skills",
    response_model=BackfillJobSkillsResult,
    status_code=status.HTTP_200_OK,
    summary="Backfill required skills for existing jobs",
)
def backfill_job_skills(
    db: Session = Depends(get_db),
    _admin_key: None = Depends(require_admin_key),
) -> BackfillJobSkillsResult:
    result = service.backfill_job_skills(db)
    return BackfillJobSkillsResult(**result)


@router.delete(
    "/clear-by-source",
    response_model=ClearJobsBySourceResult,
    status_code=status.HTTP_200_OK,
    summary="Delete all jobs for a specific source",
)
def clear_jobs_by_source(
    source: str = Query(..., description="Source name, e.g. adzuna or manual"),
    db: Session = Depends(get_db),
    _admin_key: None = Depends(require_admin_key),
) -> ClearJobsBySourceResult:
    deleted = service.clear_jobs_by_source(db, source=source)
    return ClearJobsBySourceResult(source=source, deleted=deleted)


@router.post(
    "/ingest",
    response_model=IngestJobsResult,
    status_code=status.HTTP_200_OK,
    summary="Ingest jobs from Adzuna",
)
def ingest_jobs(
    payload: IngestJobsRequest,
    db: Session = Depends(get_db),
    _admin_key: None = Depends(require_admin_key),
) -> IngestJobsResult:
    summary = ingestion.ingest_adzuna_jobs(
        db=db,
        keyword=payload.keyword,
        location=payload.location,
        country=payload.country,
        max_results=payload.max_results,
    )

    return IngestJobsResult(
        fetched=summary.fetched,
        created=summary.created,
        skipped=summary.skipped,
        errors=summary.errors,
        keyword=summary.keyword,
        location=summary.location,
        country=summary.country,
    )


@router.post(
    "/search-external",
    response_model=ExternalJobSearchResult,
    status_code=status.HTTP_200_OK,
    summary="Search external jobs live",
)
def search_external_jobs(
    payload: ExternalJobSearchRequest,
) -> ExternalJobSearchResult:
    if payload.source == "remotive":
        jobs = service.fetch_remotive_jobs(
            keyword=payload.keyword or "",
            limit=payload.max_results,
            location=payload.location,
            country=payload.country,
        )
    else:
        client = get_job_client(payload.source)
        jobs = client.search(payload)

    return ExternalJobSearchResult(
        total=len(jobs),
        items=[ExternalJobRead(**job) for job in jobs],
        keyword=payload.keyword or "",
        location=payload.location,
        country=payload.country,
        page=payload.page,
        source=payload.source,
    )


@router.post(
    "/seed-demo",
    response_model=SeedDemoResult,
    status_code=status.HTTP_200_OK,
    summary="Seed database with demo jobs for testing",
)
def seed_demo_jobs(
    db: Session = Depends(get_db),
    _admin_key: None = Depends(require_admin_key),
) -> SeedDemoResult:
    created = 0
    skipped = 0

    for job_data in DEMO_JOBS:
        existing = db.scalar(
            select(JobPosting).where(
                JobPosting.source == "demo",
                JobPosting.source_id == job_data["source_id"],
            )
        )
        if existing:
            skipped += 1
            continue

        db.add(JobPosting(**job_data))
        created += 1

    db.commit()

    return SeedDemoResult(
        created=created,
        skipped=skipped,
        message=(
            f"Loaded {created} demo job{'s' if created != 1 else ''}."
            if created > 0
            else "Demo jobs already loaded."
        ),
    )


@router.get(
    "/",
    response_model=JobPostingList,
    summary="List all job postings",
)
def list_jobs(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
) -> JobPostingList:
    total, jobs = service.list_jobs(db, skip=skip, limit=limit)
    return JobPostingList(total=total, items=jobs)


@router.get(
    "/{job_id}",
    response_model=JobPostingRead,
    summary="Get a single job posting",
)
def get_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> JobPostingRead:
    job = service.get_job(db, job_id)
    if job is None:
        raise NotFoundError("Job", str(job_id))
    return job


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a job posting",
)
def delete_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> None:
    job = service.get_job(db, job_id)
    if job is None:
        raise NotFoundError("Job", str(job_id))
    service.delete_job(db, job)