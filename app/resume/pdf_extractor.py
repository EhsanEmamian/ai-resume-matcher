import io
from pathlib import Path

from pypdf import PdfReader


class PDFExtractionError(Exception):
    pass


def _extract_text_from_reader(reader: PdfReader) -> str:
    pages_text: list[str] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            pages_text.append(text.strip())

    full_text = "\n\n".join(pages_text).strip()

    if not full_text:
        raise PDFExtractionError("No readable text could be extracted from this PDF.")

    return full_text


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        return _extract_text_from_reader(reader)
    except PDFExtractionError:
        raise
    except Exception as exc:
        raise PDFExtractionError(f"Failed to extract text from PDF: {exc}") from exc


def extract_text_from_pdf(file_path: str) -> str:
    path = Path(file_path)

    if not path.exists():
        raise PDFExtractionError("PDF file not found.")

    try:
        reader = PdfReader(str(path))
        return _extract_text_from_reader(reader)
    except PDFExtractionError:
        raise
    except Exception as exc:
        raise PDFExtractionError(f"Failed to extract text from PDF: {exc}") from exc