import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.ai.resume_parser import ResumeParsingError, parse_resume_with_ai
from app.resume.models import Resume, ResumeProfile
from app.resume.pdf_extractor import PDFExtractionError, extract_text_from_pdf

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ResumeUploadError(Exception):
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


def create_resume(db: Session, upload_file: UploadFile) -> Resume:
    file_path = None

    try:
        file_path, _stored_name = save_resume_file(upload_file)
        raw_text = extract_text_from_pdf(file_path)

        resume = Resume(
            filename=upload_file.filename or "resume.pdf",
            content_type=upload_file.content_type or "application/pdf",
            file_path=file_path,
            raw_text=raw_text,
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

    parsed_data = parse_resume_with_ai(resume.raw_text)

    existing_profile = db.scalar(
        select(ResumeProfile).where(ResumeProfile.resume_id == resume_id)
    )

    if existing_profile is None:
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
    else:
        existing_profile.skills = parsed_data["skills"]
        existing_profile.technologies = parsed_data["technologies"]
        existing_profile.languages = parsed_data["languages"]
        existing_profile.years_of_experience = parsed_data["years_of_experience"]
        existing_profile.seniority_level = parsed_data["seniority_level"]
        existing_profile.suggested_roles = parsed_data["suggested_roles"]
        existing_profile.raw_ai_response = parsed_data
        profile = existing_profile

    db.commit()
    db.refresh(profile)
    return profile