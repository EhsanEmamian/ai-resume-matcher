import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class JobPostingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    required_skills: list[str] = Field(default_factory=list)
    location: str | None = Field(default=None, max_length=255)
    remote: bool = False
    posted_at: datetime | None = None


class JobPostingRead(BaseModel):
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


class JobPostingList(BaseModel):
    total: int
    items: list[JobPostingRead]