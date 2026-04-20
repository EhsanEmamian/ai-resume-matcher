import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.matching import service
from app.matching.schemas import MatchListResponse

router = APIRouter()


@router.post(
    "/{resume_id}",
    response_model=MatchListResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate and store matches for a resume",
)
def generate_matches(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> MatchListResponse:
    try:
        items = service.generate_matches_for_resume(db, resume_id)
        return MatchListResponse(total=len(items), items=items)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/{resume_id}",
    response_model=MatchListResponse,
    status_code=status.HTTP_200_OK,
    summary="List stored matches for a resume",
)
def list_matches(
    resume_id: uuid.UUID,
    min_score: float = Query(default=0.0, ge=0.0, le=1.0),
    sort_by: str = Query(default="score", pattern="^(score|matched_at)$"),
    db: Session = Depends(get_db),
) -> MatchListResponse:
    try:
        total, items = service.list_matches_for_resume(
            db=db,
            resume_id=resume_id,
            min_score=min_score,
            sort_by=sort_by,
        )
        return MatchListResponse(total=total, items=items)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc