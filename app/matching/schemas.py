import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class MatchedJobRead(BaseModel):
    id: uuid.UUID
    title: str
    company: str
    description: str
    required_skills: list[str]
    location: str | None
    remote: bool
    posted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchResultRead(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    job_id: uuid.UUID
    score: float
    reason: str
    score_breakdown: dict | None
    matched_skills: list[str] | None
    matched_at: datetime
    job: MatchedJobRead

    model_config = {"from_attributes": True}


class MatchListResponse(BaseModel):
    total: int
    items: list[MatchResultRead]


class ProfilePreviewRequest(BaseModel):
    skills: list[str] = Field(
        ...,
        min_length=1,
        description="Skills and technologies selected for the manual profile.",
    )
    suggested_roles: list[str] = Field(
        ...,
        min_length=1,
        description="Role keywords used for title overlap scoring.",
    )
    seniority_level: Literal["Junior", "Mid", "Senior"] = Field(
        ...,
        description="Candidate seniority for display and role expansion.",
    )