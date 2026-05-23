import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


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


class ScoreBreakdown(BaseModel):
    """Five-component explainable score with signals and narrative."""

    skill_overlap: float
    role_alignment: float
    seniority_fit: float
    language_fit: float
    experience_fit: float
    final_score: float
    weights: dict[str, float] = Field(
        default_factory=lambda: {
            "skill_overlap": 0.45,
            "role_alignment": 0.25,
            "seniority_fit": 0.10,
            "language_fit": 0.10,
            "experience_fit": 0.10,
        }
    )
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    seniority_signal: str | None = None
    language_signal: str | None = None
    data_quality: Literal["full", "minimal"] = "full"
    narrative: str = ""

    @field_validator(
        "skill_overlap",
        "role_alignment",
        "seniority_fit",
        "language_fit",
        "experience_fit",
        "final_score",
        mode="before",
    )
    @classmethod
    def coerce_float(cls, value: Any) -> float:
        return float(value) if value is not None else 0.0

    @classmethod
    def from_storage(cls, raw: dict[str, Any] | None) -> "ScoreBreakdown | None":
        if raw is None:
            return None
        if "skill_overlap" in raw:
            return cls.model_validate(raw)
        # Legacy 3-factor breakdown
        if "skill_overlap_score" in raw:
            legacy_skill = float(raw.get("skill_overlap_score", 0))
            legacy_role = float(raw.get("role_overlap_score", 0))
            legacy_remote = float(raw.get("remote_bonus", 0))
            final = float(raw.get("final_score", legacy_skill + legacy_role + legacy_remote))
            return cls(
                skill_overlap=legacy_skill,
                role_alignment=legacy_role,
                seniority_fit=0.0,
                language_fit=0.0,
                experience_fit=legacy_remote,
                final_score=final,
                matched_skills=list(raw.get("matched_skills", [])),
                missing_skills=list(raw.get("missing_skills", [])),
                data_quality="minimal",
                narrative="Legacy match record (regenerate matches for full breakdown).",
            )
        return None


class MatchResultRead(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    job_id: uuid.UUID
    score: float
    reason: str
    score_breakdown: ScoreBreakdown | None = None
    matched_skills: list[str] | None
    matched_at: datetime
    job: MatchedJobRead

    model_config = {"from_attributes": True}

    @field_validator("score_breakdown", mode="before")
    @classmethod
    def parse_score_breakdown(cls, value: Any) -> ScoreBreakdown | None:
        if value is None or isinstance(value, ScoreBreakdown):
            return value
        if isinstance(value, dict):
            return ScoreBreakdown.from_storage(value)
        return None


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
