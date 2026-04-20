import uuid
from datetime import datetime

from pydantic import BaseModel


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
    matched_at: datetime
    job: MatchedJobRead

    model_config = {"from_attributes": True}


class MatchListResponse(BaseModel):
    total: int
    items: list[MatchResultRead]