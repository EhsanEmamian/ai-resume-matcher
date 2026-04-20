from anthropic import Anthropic

from app.config import settings


def get_anthropic_client() -> Anthropic:
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not set.")
    return Anthropic(api_key=settings.ANTHROPIC_API_KEY)