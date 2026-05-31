"""
Unit tests for experience-requirement extraction in app.jobs.skill_extractor.

Title-level signals take priority over description regex and phrase fallbacks.
"""

from __future__ import annotations

import pytest

from app.jobs.skill_extractor import (
    MAX_SALARY_LENGTH,
    extract_experience_requirement_from_text,
    extract_salary_text_from_text,
    normalize_salary_text_for_storage,
)


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


@pytest.mark.parametrize(
    ("description", "expected_fragment"),
    [
        (
            "Für diese Position ist ein Mindestgehalt von EUR 4.300,-- brutto/Monat "
            "bei Vollzeitbeschäftigung vorgesehen. Weitere Informationen folgen...",
            "EUR 4.300,-- brutto/Monat",
        ),
        (
            "Salary: £45,000 – £55,000 per year depending on experience.",
            "Salary: £45,000 – £55,000 per year",
        ),
        (
            "€60.000 - €80.000 EUR pro Jahr, 30 Tage Urlaub",
            "€60.000 - €80.000 EUR pro Jahr",
        ),
    ],
    ids=["german-mindestgehalt", "english-range", "german-range"],
)
def test_extract_salary_text_bounded_patterns(
    description: str,
    expected_fragment: str,
) -> None:
    result = extract_salary_text_from_text("", description)

    assert result is not None
    assert expected_fragment in result
    assert len(result) <= MAX_SALARY_LENGTH


def test_extract_salary_text_returns_none_without_salary_info() -> None:
    description = "We are looking for a motivated Python developer to join our team."

    assert extract_salary_text_from_text("", description) is None


def test_extract_salary_text_caps_adversarial_long_match() -> None:
    description = "EUR 5000 " + "x" * 200 + " brutto"

    result = extract_salary_text_from_text("", description)

    assert result is not None
    assert "EUR 5000" in result
    assert len(result) <= MAX_SALARY_LENGTH


def test_normalize_salary_text_for_storage_caps_and_rejects_invalid() -> None:
    assert normalize_salary_text_for_storage("EUR 4.300 brutto/Monat") == (
        "EUR 4.300 brutto/Monat"
    )
    assert len(normalize_salary_text_for_storage("EUR 5000 " + "x" * 200) or "") == (
        MAX_SALARY_LENGTH
    )
    assert normalize_salary_text_for_storage("no digits here") is None
    assert normalize_salary_text_for_storage(None) is None
