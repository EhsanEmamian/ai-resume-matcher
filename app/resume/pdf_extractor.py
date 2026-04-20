from pathlib import Path

import pdfplumber


class PDFExtractionError(Exception):
    pass


def extract_text_from_pdf(file_path: str) -> str:
    path = Path(file_path)

    if not path.exists():
        raise PDFExtractionError("PDF file not found.")

    try:
        pages_text: list[str] = []

        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append(text.strip())

        full_text = "\n\n".join(pages_text).strip()

        if not full_text:
            raise PDFExtractionError("No readable text could be extracted from this PDF.")

        return full_text

    except PDFExtractionError:
        raise
    except Exception as exc:
        raise PDFExtractionError(f"Failed to extract text from PDF: {exc}") from exc