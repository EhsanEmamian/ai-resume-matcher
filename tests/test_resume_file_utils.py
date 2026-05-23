import hashlib

import pytest

from app.resume.file_utils import (
    MAX_FILE_SIZE_BYTES,
    PdfValidationError,
    assert_file_size_and_page_count,
    assert_pdf_upload,
    compute_sha256,
)


def test_compute_sha256() -> None:
    payload = b"%PDF-1.4 test"
    assert compute_sha256(payload) == hashlib.sha256(payload).hexdigest()


def test_assert_pdf_upload_rejects_non_pdf() -> None:
    with pytest.raises(PdfValidationError):
        assert_pdf_upload("resume.docx", "application/msword")


def test_assert_file_size_rejects_oversize() -> None:
    with pytest.raises(PdfValidationError, match="maximum size"):
        assert_file_size_and_page_count(b"x" * (MAX_FILE_SIZE_BYTES + 1))
