import uuid
from datetime import datetime

from pydantic import BaseModel

from app.matching.schemas import MatchResultRead


class ResumeProfileRead(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    skills: list[str]
    technologies: list[str]
    languages: list[str]
    years_of_experience: int | None
    seniority_level: str | None
    suggested_roles: list[str]
    raw_ai_response: dict | None
    parsed_at: datetime

    model_config = {"from_attributes": True}


class ResumeRead(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    file_path: str
    raw_text: str
    uploaded_at: datetime
    is_resume: bool | None = None
    document_type: str | None = None
    validation_confidence: float | None = None
    rejection_reason: str | None = None
    profile: ResumeProfileRead | None = None

    model_config = {"from_attributes": True}


class ResumeUploadResponse(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ResumeParseResponse(BaseModel):
    resume_id: uuid.UUID
    profile: ResumeProfileRead

    model_config = {"from_attributes": True}


class ResumeUploadAndParseResponse(BaseModel):
    resume_id: uuid.UUID
    filename: str
    content_type: str
    uploaded_at: datetime
    profile: ResumeProfileRead
    cached: bool = False

    model_config = {"from_attributes": True}


class ResumeFullResponse(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    file_path: str
    raw_text: str
    uploaded_at: datetime
    is_resume: bool | None = None
    document_type: str | None = None
    validation_confidence: float | None = None
    rejection_reason: str | None = None
    profile: ResumeProfileRead | None = None
    matches: list[MatchResultRead] = []

    model_config = {"from_attributes": True}


class ResumeValidationRejectedResponse(BaseModel):
    resume_id: uuid.UUID
    filename: str
    content_type: str
    uploaded_at: datetime
    is_resume: bool
    document_type: str
    validation_confidence: float
    rejection_reason: str