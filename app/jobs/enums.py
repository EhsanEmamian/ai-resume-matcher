from enum import Enum


class EnrichmentStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    PROCESSING = "processing"
    PENDING = "pending"
    NOT_ATTEMPTED = "not_attempted"


class EnrichmentFailureReason(str, Enum):
    NO_URL = "no_url"
    FETCH_FAILED = "fetch_failed"
    TIMEOUT = "timeout"
    BLOCKED = "blocked"
    JS_RENDERED = "js_rendered"
    TOO_SHORT_RESPONSE = "too_short_response"
    TOO_SHORT_TEXT = "too_short_text"
    REDIRECT_INTERSTITIAL = "redirect_interstitial"
    REDIRECT_FALLBACK = "redirect_fallback"
    NOT_FOUND = "not_found"
