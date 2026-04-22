import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import NotFoundError
from app.jobs import service
from app.jobs.schemas import JobPostingCreate, JobPostingList, JobPostingRead

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