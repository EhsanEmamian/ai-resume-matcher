import uuid
import logging

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.ai.resume_parser import ResumeAIUnavailableError
from app.core.limiter import limiter
from app.database import get_db
from app.exceptions import AIParsingError, InvalidFileError, NotFoundError
from app.resume import service
from app.resume.discovery import run_auto_discovery
from app.resume.file_utils import (
    PdfValidationError,
    assert_file_size_and_page_count,
    assert_pdf_upload,
    compute_sha256,
)
from app.resume.pdf_extractor import PDFExtractionError
from app.resume.schemas import (
    DiscoveryStatusResponse,
    ResumeFullResponse,
    ResumeParseResponse,
    ResumeProfileRead,
    ResumeRead,
    ResumeUploadAndParseResponse,
    ResumeUploadResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _build_upload_and_parse_response(
    resume,
    profile,
    *,
    cached: bool,
) -> ResumeUploadAndParseResponse:
    return ResumeUploadAndParseResponse(
        resume_id=resume.id,
        filename=resume.filename,
        content_type=resume.content_type,
        uploaded_at=resume.uploaded_at,
        profile=ResumeProfileRead.model_validate(profile),
        cached=cached,
    )


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF resume",
)
def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ResumeUploadResponse:
    try:
        resume = service.create_resume(
            db,
            file,
            client_ip=request.client.host if request.client else None,
        )
        return resume
    except service.ResumeUploadError as exc:
        raise InvalidFileError(str(exc)) from exc
    except service.ResumeUploadLimitExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except PDFExtractionError as exc:
        raise InvalidFileError(str(exc)) from exc


@router.post(
    "/upload-and-parse",
    response_model=ResumeUploadAndParseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF resume and parse it immediately",
)
@limiter.limit("3/day")
async def upload_and_parse_resume(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ResumeUploadAndParseResponse | JSONResponse:
    client_ip = request.client.host if request.client else None
    filename = file.filename or "resume.pdf"
    content_type = file.content_type or "application/pdf"

    try:
        file_bytes = await file.read()

        # Layer 0 — PDF type gate (MIME + extension)
        assert_pdf_upload(filename, content_type)

        # Layer 1 — Size and page count
        assert_file_size_and_page_count(file_bytes)

        # Layer 2 — SHA-256 deduplication cache
        file_hash = compute_sha256(file_bytes)
        cached_result = service.find_validated_resume_by_hash(db, file_hash)
        if cached_result is not None:
            resume, profile = cached_result
            background_tasks.add_task(run_auto_discovery, resume.id, profile)
            response = _build_upload_and_parse_response(
                resume,
                profile,
                cached=True,
            )
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=response.model_dump(mode="json"),
            )

        # Layer 3 — Persist + validate + Claude parse (rate limit enforced above)
        resume, profile = service.upload_and_parse(
            db,
            file_bytes,
            filename=filename,
            content_type=content_type,
            client_ip=client_ip,
            file_hash=file_hash,
        )
        background_tasks.add_task(run_auto_discovery, resume.id, profile)
        return _build_upload_and_parse_response(resume, profile, cached=False)

    except PdfValidationError as exc:
        raise InvalidFileError(str(exc)) from exc
    except service.ResumeUploadError as exc:
        raise InvalidFileError(str(exc)) from exc
    except PDFExtractionError as exc:
        raise InvalidFileError(str(exc)) from exc
    except service.ResumeDocumentRejectedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": str(exc),
                "document_type": exc.document_type,
                "confidence": exc.confidence,
                "resume_id": str(exc.resume.id) if exc.resume else None,
            },
        ) from exc
    except ResumeAIUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise AIParsingError(str(exc)) from exc


@router.get(
    "/{resume_id}/discovery-status",
    response_model=DiscoveryStatusResponse,
    summary="Poll auto-discovery and matching progress",
)
def get_discovery_status(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DiscoveryStatusResponse:
    resume = service.get_resume(db, resume_id)
    if resume is None:
        raise NotFoundError("Resume", str(resume_id))

    return DiscoveryStatusResponse(
        status=resume.discovery_status,
        match_count=resume.discovery_job_count,
    )


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
        raise NotFoundError("Resume", str(resume_id))
    return resume


@router.get(
    "/{resume_id}/full",
    response_model=ResumeFullResponse,
    summary="Get a stored resume with profile and matches",
)
def get_resume_full(
    resume_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ResumeFullResponse:
    result = service.get_resume_full(db, resume_id)
    if result is None:
        raise NotFoundError("Resume", str(resume_id))

    resume, matches = result

    return ResumeFullResponse(
        id=resume.id,
        filename=resume.filename,
        content_type=resume.content_type,
        file_path=resume.file_path,
        raw_text=resume.raw_text,
        uploaded_at=resume.uploaded_at,
        is_resume=resume.is_resume,
        document_type=resume.document_type,
        validation_confidence=resume.validation_confidence,
        rejection_reason=resume.rejection_reason,
        profile=resume.profile,
        matches=matches,
    )


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
    except service.ResumeDocumentRejectedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": str(exc),
                "document_type": exc.document_type,
                "confidence": exc.confidence,
                "resume_id": str(exc.resume.id) if exc.resume else None,
            },
        ) from exc
    except ResumeAIUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        message = str(exc)
        if "not found" in message.lower():
            raise NotFoundError("Resume", str(resume_id)) from exc
        raise AIParsingError(message) from exc
