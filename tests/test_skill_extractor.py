"""
Unit tests for experience-requirement extraction in app.jobs.skill_extractor.

Title-level signals take priority over description regex and phrase fallbacks.
"""

from __future__ import annotations

import pytest

from app.jobs.skill_extractor import extract_experience_requirement_from_text


@pytest.mark.parametrize(
    ("title", "description", "expected"),
    [
        ("Senior Backend Engineer", "", "Senior level"),
        ("Lead Python Developer", "", "Senior level"),
        ("Principal Software Architect", "", "Senior level"),
        (
            "Staff Engineer",
            "We value a senior mindset and strong collaboration skills.",
            None,
        ),
    ],
    ids=[
        "title-senior",
        "title-lead",
        "title-principal",
        "neutral-title-description-senior-word-only",
    ],
)
def test_extract_experience_senior_title_signals(
    title: str,
    description: str,
    expected: str | None,
) -> None:
    """Explicit seniority in the job title maps to Senior level."""
    assert extract_experience_requirement_from_text(title, description) == expected


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("Junior Frontend Developer", "Junior level"),
        ("Entry Level Data Analyst", "Junior level"),
        ("Software Engineering Trainee", "Junior level"),
        ("Intern Software Engineer", "Internship"),
        ("Praktikant DevOps", "Internship"),
    ],
    ids=[
        "title-junior",
        "title-entry",
        "title-trainee",
        "title-intern",
        "title-praktik",
    ],
)
def test_extract_experience_junior_and_intern_title_signals(
    title: str,
    expected: str,
) -> None:
    """Junior/entry/trainee and intern/praktik titles map to the correct levels."""
    assert extract_experience_requirement_from_text(title, "") == expected


@pytest.mark.parametrize(
    ("title", "description", "expected"),
    [
        (
            "Backend Developer",
            "You should have 5+ years of professional Python work.",
            "5+ years of experience",
        ),
        (
            "Full Stack Engineer",
            "Requires 3 years of experience with React.",
            "3 years of experience",
        ),
        (
            "Data Engineer",
            "Minimum of 7 years in data platforms.",
            "Minimum 7 years of experience",
        ),
        (
            "DevOps Engineer",
            "At least 4 years working with Kubernetes.",
            "Minimum 4 years of experience",
        ),
        (
            "Softwareentwickler",
            "Wir erwarten mindestens 3 Jahre in agilen Teams.",
            "At least 3 years of experience",
        ),
        (
            "Backend Entwickler",
            "Mindestens 3 Jahre Berufserfahrung im Backend.",
            "At least 3 years of experience",
        ),
        (
            "Platform Engineer",
            "5 Jahre einschlägige Berufserfahrung mit Cloud.",
            "5 years of professional experience",
        ),
    ],
    ids=[
        "years-plus-en",
        "years-of-experience-en",
        "minimum-of-years-en",
        "at-least-years-en",
        "mindestens-jahre-de",
        "mindestens-jahre-berufserfahrung-de",
        "jahre-berufserfahrung-de",
    ],
)
def test_extract_experience_from_description_regex_patterns(
    title: str,
    description: str,
    expected: str,
) -> None:
    """Neutral titles defer to English/German year patterns in the description."""
    assert extract_experience_requirement_from_text(title, description) == expected


def test_extract_experience_title_priority_over_description() -> None:
    """Title seniority wins even when the description suggests fewer years."""
    result = extract_experience_requirement_from_text(
        "Senior Engineer",
        "Nice to have 1 year of experience.",
    )
    assert result == "Senior level"


@pytest.mark.parametrize(
    ("title", "description"),
    [
        (
            "Frontend Developer",
            (
                "Benefits: mentorship program with an experienced mentor, "
                "flexible hours, and learning budget."
            ),
        ),
        (
            "Frontend Developer",
            "Join our team. Mentorship from experienced engineers.",
        ),
    ],
    ids=["benefits-experienced-mentor", "description-experienced-engineers"],
)
def test_extract_experience_false_positive_experienced_mentor_not_senior(
    title: str,
    description: str,
) -> None:
    """
    Colloquial 'experienced' wording must not imply Senior level or years.

    Without title seniority markers or quantified year patterns, extraction
    should return None.
    """
    assert extract_experience_requirement_from_text(title, description) is None


@pytest.mark.parametrize(
    ("title", "description", "expected"),
    [
        (
            "Product Manager",
            "Candidates with mehrjährige erfahrung in B2B SaaS preferred.",
            "Several years of experience",
        ),
        (
            "Graduate Developer",
            "Erste programmiererfahrung ist von Vorteil.",
            "First programming experience",
        ),
        (
            "Consultant",
            "Relevante Berufserfahrung in der Branche erforderlich.",
            "Professional experience required",
        ),
    ],
    ids=[
        "phrase-mehrjaehrige-erfahrung",
        "phrase-erste-programmiererfahrung",
        "phrase-berufserfahrung",
    ],
)
def test_extract_experience_german_phrase_fallbacks(
    title: str,
    description: str,
    expected: str,
) -> None:
    """German phrase fallbacks apply when title and regex patterns do not match."""
    assert extract_experience_requirement_from_text(title, description) == expected


def test_extract_experience_empty_inputs_return_none() -> None:
    """No title signals and empty description should not invent a requirement."""
    assert extract_experience_requirement_from_text("", "") is None
