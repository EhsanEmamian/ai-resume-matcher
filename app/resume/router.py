import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.ai.resume_parser import ResumeParsingError
from app.database import get_db
from app.resume import service
from app.resume.pdf_extractor import PDFExtractionError
from app.resume.schemas import ResumeParseResponse, ResumeRead, ResumeUploadResponse

router = APIRouter()


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF resume",
)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ResumeUploadResponse:
    try:
        resume = service.create_resume(db, file)
        return resume
    except service.ResumeUploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except PDFExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{resume_id}",
    response_model=ResumeRead,
    summary="Get a stored resume",
)
def get_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ResumeRead:
    resume = service.get_resume(db, resume_id)
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with id '{resume_id}' not found.",
        )
    return resume


@router.post(
    "/{resume_id}/parse",
    response_model=ResumeParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse a stored resume with AI and save its structured profile",
)
def parse_resume(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ResumeParseResponse:
    try:
        profile = service.parse_resume_profile(db, resume_id)
        return ResumeParseResponse(
            resume_id=resume_id,
            profile=profile,
        )
    except ResumeParsingError as exc:
        message = str(exc)
        if "not found" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from exc