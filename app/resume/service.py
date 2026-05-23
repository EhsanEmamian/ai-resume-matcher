from __future__ import annotations

import shutil
import uuid
from datetime import datetime, time, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.ai.resume_parser import ResumeParsingError, parse_resume_with_ai
from app.matching.models import MatchResult
from app.resume.models import Resume, ResumeProfile
from app.resume.pdf_extractor import PDFExtractionError, extract_text_from_pdf
from app.resume.text_utils import normalize_resume_text
from app.resume.validation import validate_resume_document

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ResumeUploadError(Exception):
    pass


class ResumeDocumentRejectedError(Exception):
    def __init__(
        self,
        message: str,
        *,
        document_type: str,
        confidence: float,
        resume: Resume | None = None,
    ):
        super().__init__(message)
        self.document_type = document_type
        self.confidence = confidence
        self.resume = resume


class ResumeUploadLimitExceededError(Exception):
    pass


def _build_unique_filename(original_filename: str) -> str:
    suffix = Path(original_filename).suffix.lower() or ".pdf"
    return f"{uuid.uuid4()}{suffix}"


def save_resume_file(upload_file: UploadFile) -> tuple[str, str]:
    if upload_file.content_type != "application/pdf":
        raise ResumeUploadError("Only PDF files are allowed.")

    unique_filename = _build_unique_filename(upload_file.filename or "resume.pdf")
    destination = UPLOAD_DIR / unique_filename

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    except Exception as exc:
        raise ResumeUploadError(f"Failed to save uploaded file: {exc}") from exc

    return str(destination), unique_filename


def save_resume_bytes(file_bytes: bytes, original_filename: str) -> tuple[str, str]:
    unique_filename = _build_unique_filename(original_filename)
    destination = UPLOAD_DIR / unique_filename

    try:
        destination.write_bytes(file_bytes)
    except Exception as exc:
        raise ResumeUploadError(f"Failed to save uploaded file: {exc}") from exc

    return str(destination), unique_filename


def find_validated_resume_by_hash(
    db: Session,
    file_hash: str,
) -> tuple[Resume, ResumeProfile] | None:
    resume = db.scalar(
        select(Resume)
        .options(selectinload(Resume.profile))
        .where(
            Resume.file_hash == file_hash,
            Resume.is_resume.is_(True),
        )
    )
    if resume is None or resume.profile is None:
        return None
    return resume, resume.profile


def _count_today_uploads_for_ip(db: Session, client_ip: str) -> int:
    start_of_day = datetime.combine(
        datetime.now(timezone.utc).date(),
        time.min,
        tzinfo=timezone.utc,
    )

    # استفاده از دیتابیس برای شمارش (بسیار سریع‌تر و بهینه‌تر از شمردن در پایتون)
    stmt = select(func.count()).select_from(Resume).where(
        Resume.client_ip == client_ip,
        Resume.uploaded_at >= start_of_day,
    )

    return db.scalar(stmt) or 0


def create_resume_from_bytes(
    db: Session,
    file_bytes: bytes,
    *,
    filename: str,
    content_type: str,
    client_ip: str | None,
    file_hash: str,
) -> Resume:
    file_path = None

    try:
        file_path, _stored_name = save_resume_bytes(file_bytes, filename)
        raw_text = normalize_resume_text(extract_text_from_pdf(file_path))

        resume = Resume(
            filename=filename,
            content_type=content_type,
            file_path=file_path,
            raw_text=raw_text,
            client_ip=client_ip,
            file_hash=file_hash,
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume

    except (ResumeUploadError, PDFExtractionError):
        db.rollback()
        if file_path:
            path = Path(file_path)
            if path.exists():
                path.unlink()
        raise

    except Exception as exc:
        db.rollback()
        if file_path:
            path = Path(file_path)
            if path.exists():
                path.unlink()
        raise ResumeUploadError(f"Unexpected error while creating resume: {exc}") from exc


def create_resume(
    db: Session,
    upload_file: UploadFile,
    client_ip: str | None = None,
) -> Resume:
    file_path = None

    try:
        if client_ip:
            today_uploads = _count_today_uploads_for_ip(db, client_ip)
            if today_uploads >= 30:
                raise ResumeUploadLimitExceededError(
                    "Guest upload limit reached for today. Please try again tomorrow."
                )

        file_path, _stored_name = save_resume_file(upload_file)
        raw_text = normalize_resume_text(extract_text_from_pdf(file_path))

        resume = Resume(
            filename=upload_file.filename or "resume.pdf",
            content_type=upload_file.content_type or "application/pdf",
            file_path=file_path,
            raw_text=raw_text,
            client_ip=client_ip,
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume

    except (ResumeUploadError, ResumeUploadLimitExceededError, PDFExtractionError):
        db.rollback()
        if file_path:
            path = Path(file_path)
            if path.exists():
                path.unlink()
        raise

    except Exception as exc:
        db.rollback()
        if file_path:
            path = Path(file_path)
            if path.exists():
                path.unlink()
        raise ResumeUploadError(f"Unexpected error while creating resume: {exc}") from exc


def get_resume(db: Session, resume_id: uuid.UUID) -> Resume | None:
    stmt = (
        select(Resume)
        .options(selectinload(Resume.profile))
        .where(Resume.id == resume_id)
    )
    return db.scalar(stmt)


def parse_resume_profile(db: Session, resume_id: uuid.UUID) -> ResumeProfile:
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise ResumeParsingError(f"Resume with id '{resume_id}' not found.")

    existing_profile = db.scalar(
        select(ResumeProfile).where(ResumeProfile.resume_id == resume_id)
    )

    if existing_profile is not None:
        return existing_profile

    if resume.is_resume is False:
        raise ResumeDocumentRejectedError(
            resume.rejection_reason
            or "This document does not look like a resume or CV. Please upload a valid resume PDF.",
            document_type=resume.document_type or "unknown",
            confidence=resume.validation_confidence or 0.0,
            resume=resume,
        )

    if (
        resume.is_resume is True
        and resume.document_type
        and resume.validation_confidence is not None
    ):
        validation = None
    else:
        validation = validate_resume_document(resume.raw_text)

    if validation is not None:
        resume.is_resume = validation.is_resume
        resume.document_type = validation.document_type
        resume.validation_confidence = validation.confidence
        resume.rejection_reason = validation.rejection_reason

        db.add(resume)
        db.commit()
        db.refresh(resume)

        if not validation.is_resume:
            raise ResumeDocumentRejectedError(
                validation.rejection_reason
                or "This document does not look like a resume or CV. Please upload a valid resume PDF.",
                document_type=validation.document_type,
                confidence=validation.confidence,
                resume=resume,
            )

    parsed_data = parse_resume_with_ai(resume.raw_text)

    profile = ResumeProfile(
        resume_id=resume.id,
        skills=parsed_data["skills"],
        technologies=parsed_data["technologies"],
        languages=parsed_data["languages"],
        years_of_experience=parsed_data["years_of_experience"],
        seniority_level=parsed_data["seniority_level"],
        suggested_roles=parsed_data["suggested_roles"],
        raw_ai_response=parsed_data,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def upload_and_parse(
    db: Session,
    file_bytes: bytes,
    *,
    filename: str,
    content_type: str,
    client_ip: str | None,
    file_hash: str,
) -> tuple[Resume, ResumeProfile]:
    """Layer 3: Persist resume bytes, validate document, and run AI parsing."""
    resume = create_resume_from_bytes(
        db,
        file_bytes,
        filename=filename,
        content_type=content_type,
        client_ip=client_ip,
        file_hash=file_hash,
    )
    profile = parse_resume_profile(db, resume.id)
    return resume, profile


def create_and_parse_resume(
    db: Session,
    upload_file: UploadFile,
    client_ip: str | None = None,
) -> tuple[Resume, ResumeProfile]:
    resume = create_resume(db, upload_file, client_ip=client_ip)
    profile = parse_resume_profile(db, resume.id)
    return resume, profile


def get_resume_full(db: Session, resume_id: uuid.UUID) -> tuple[Resume, list[MatchResult]] | None:
    stmt = (
        select(Resume)
        .options(selectinload(Resume.profile))
        .where(Resume.id == resume_id)
    )
    resume = db.scalar(stmt)

    if resume is None:
        return None

    match_stmt = (
        select(MatchResult)
        .options(selectinload(MatchResult.job))
        .where(MatchResult.resume_id == resume_id)
        .order_by(MatchResult.score.desc(), MatchResult.matched_at.desc())
    )
    matches = list(db.scalars(match_stmt).all())

    return resume, matches