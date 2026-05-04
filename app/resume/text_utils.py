from __future__ import annotations

import re


def normalize_resume_text(raw_text: str, max_chars: int = 12000) -> str:
    text = raw_text or ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = text.strip()

    if len(text) > max_chars:
        text = text[:max_chars].strip()

    return text