import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    is_resume: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    document_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    validation_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    profile: Mapped["ResumeProfile | None"] = relationship(
        back_populates="resume",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ResumeProfile(Base):
    __tablename__ = "resume_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default="{}",
    )
    technologies: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default="{}",
    )
    languages: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default="{}",
    )
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seniority_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    suggested_roles: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default="{}",
    )
    raw_ai_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    parsed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    resume: Mapped["Resume"] = relationship(back_populates="profile")