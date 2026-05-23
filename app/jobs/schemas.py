import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class JobPostingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    required_skills: list[str] = Field(default_factory=list)
    required_languages: list[str] = Field(default_factory=list)
    experience_requirement: str | None = None
    salary_text: str | None = None
    location: str | None = Field(default=None, max_length=255)
    remote: bool = False
    posted_at: datetime | None = None


class JobPostingRead(BaseModel):
    id: uuid.UUID
    title: str
    company: str
    description: str
    required_skills: list[str]
    required_languages: list[str] = Field(default_factory=list)
    experience_requirement: str | None = None
    salary_text: str | None = None
    source_text: str | None = None
    enrichment_status: str | None = None
    enrichment_error: str | None = None
    enrichment_failure_reason: str | None = None
    enrichment_raw_html_length: int | None = None
    enrichment_text_word_count: int | None = None
    enrichment_text_preview: str | None = None
    location: str | None
    remote: bool
    source: str
    source_id: str | None
    source_url: str | None
    salary_min: float | None
    salary_max: float | None
    contract_type: str | None
    category: str | None
    posted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class JobPostingList(BaseModel):
    total: int
    items: list[JobPostingRead]


class IngestJobsRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100)
    location: str = Field(default="", max_length=100)
    country: str = Field(default="de", min_length=2, max_length=2)
    max_results: int = Field(default=25, ge=1, le=50)


class IngestJobsResult(BaseModel):
    fetched: int
    created: int
    skipped: int
    errors: int
    keyword: str
    location: str
    country: str


# ── Source literal — single source of truth used across schemas ───────────────
JobSourceLiteral = Literal["adzuna", "arbeitnow", "jooble", "remotive"]


class ExternalJobSearchRequest(BaseModel):
    keyword: str | None = Field(
        default="",
        max_length=100,
        description="Optional search term; empty browses by location/source only.",
    )
    location: str = Field(default="", max_length=100)
    country: str = Field(default="de", min_length=2, max_length=2)
    max_results: int = Field(default=20, ge=1, le=50)
    page: int = Field(default=1, ge=1, le=20)
    source: JobSourceLiteral = "adzuna"

    @field_validator("keyword", mode="before")
    @classmethod
    def normalize_keyword(cls, value: str | None) -> str:
        if value is None:
            return ""
        return str(value).strip()


class ExternalJobRead(BaseModel):
    title: str
    company: str
    description: str
    required_skills: list[str]
    required_languages: list[str] = Field(default_factory=list)
    experience_requirement: str | None = None
    salary_text: str | None = None
    source_text: str | None = None
    enrichment_status: str | None = None
    enrichment_error: str | None = None
    enrichment_failure_reason: str | None = None
    enrichment_raw_html_length: int | None = None
    enrichment_text_word_count: int | None = None
    enrichment_text_preview: str | None = None
    location: str | None
    remote: bool
    source: str
    source_id: str | None
    source_url: str | None
    salary_min: float | None
    salary_max: float | None
    contract_type: str | None
    category: str | None
    posted_at: datetime | None


class ExternalJobSearchResult(BaseModel):
    total: int
    items: list[ExternalJobRead]
    keyword: str
    location: str
    country: str
    page: int
    source: JobSourceLiteral


class ImportExternalJobRequest(BaseModel):
    title: str
    company: str
    description: str
    required_skills: list[str] = Field(default_factory=list)
    required_languages: list[str] = Field(default_factory=list)
    experience_requirement: str | None = None
    salary_text: str | None = None
    source_text: str | None = None
    enrichment_status: str | None = None
    enrichment_error: str | None = None
    enrichment_failure_reason: str | None = None
    enrichment_raw_html_length: int | None = None
    enrichment_text_word_count: int | None = None
    enrichment_text_preview: str | None = None
    location: str | None = None
    remote: bool = False
    source: str
    source_id: str | None = None
    source_url: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    contract_type: str | None = None
    category: str | None = None
    posted_at: datetime | None = None


class ImportExternalJobResult(BaseModel):
    status: str
    job: JobPostingRead


class BackfillJobSkillsResult(BaseModel):
    total: int
    updated: int
    skipped: int


class ClearJobsBySourceResult(BaseModel):
    source: str
    deleted: int