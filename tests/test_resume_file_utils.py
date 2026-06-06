import hashlib
from pathlib import Path

import pytest

from app.resume.file_utils import (
    MAX_FILE_SIZE_BYTES,
    PdfValidationError,
    assert_file_size_and_page_count,
    assert_pdf_upload,
    compute_sha256,
    get_pdf_page_count,
)


def test_compute_sha256() -> None:
    payload = b"%PDF-1.4 test"
    assert compute_sha256(payload) == hashlib.sha256(payload).hexdigest()


def test_compute_sha256_returns_64_char_hex_string() -> None:
    """Test compute_sha256 returns a 64-char hex string."""
    payload = b"test content"
    result = compute_sha256(payload)
    assert isinstance(result, str)
    assert len(result) == 64
    assert all(c in "0123456789abcdef" for c in result)


def test_get_pdf_page_count_valid_pdf() -> None:
    """Test get_pdf_page_count returns correct count for a valid PDF bytes fixture."""
    # Use the existing test PDF fixture
    fixture_path = Path(__file__).parent / "fixtures" / "test_resume.pdf"
    pdf_bytes = fixture_path.read_bytes()
    
    page_count = get_pdf_page_count(pdf_bytes)
    assert page_count > 0
    assert isinstance(page_count, int)


def test_get_pdf_page_count_invalid_bytes() -> None:
    """Test get_pdf_page_count raises PdfValidationError for invalid bytes."""
    invalid_bytes = b"This is not a PDF file"
    
    with pytest.raises(PdfValidationError, match="Unable to read PDF"):
        get_pdf_page_count(invalid_bytes)


def test_get_pdf_page_count_empty_bytes() -> None:
    """Test get_pdf_page_count raises PdfValidationError for empty bytes."""
    with pytest.raises(PdfValidationError, match="Unable to read PDF"):
        get_pdf_page_count(b"")


def test_assert_pdf_upload_rejects_non_pdf() -> None:
    with pytest.raises(PdfValidationError):
        assert_pdf_upload("resume.docx", "application/msword")


def test_assert_file_size_rejects_oversize() -> None:
    with pytest.raises(PdfValidationError, match="maximum size"):
        assert_file_size_and_page_count(b"x" * (MAX_FILE_SIZE_BYTES + 1))
