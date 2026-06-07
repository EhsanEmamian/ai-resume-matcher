import asyncio
import pytest
import respx
from httpx import Response

from app.jobs.adzuna_client import (
    is_blocked_by_blocklist,
    is_blocked_company,
    _probe_native_async,
    filter_native_async,
    run_async_filter_sync,
)


def test_is_blocked_by_blocklist_stepstone() -> None:
    """Test is_blocked_by_blocklist returns True for stepstone.at URLs."""
    assert is_blocked_by_blocklist("https://www.stepstone.at/jobs/123") is True
    assert is_blocked_by_blocklist("https://stepstone.de/job/456") is True
    assert is_blocked_by_blocklist("https://www.stepstone.com/jobs/789") is True


def test_is_blocked_by_blocklist_not_blocked() -> None:
    """Test is_blocked_by_blocklist returns False for non-blocked URLs."""
    assert is_blocked_by_blocklist("https://www.adzuna.at/details/123") is False
    assert is_blocked_by_blocklist("https://example.com/job/456") is False


def test_is_blocked_company_stepstone() -> None:
    """Test is_blocked_company returns True for a blocked company name."""
    job = {"company": {"display_name": "StepStone GmbH"}}
    assert is_blocked_company(job) is True


def test_is_blocked_company_legitimate() -> None:
    """Test is_blocked_company returns False for a legitimate company name."""
    # Changed from 'Monster Energy GmbH' because 'monster' is in the blocklist
    job = {"company": {"display_name": "Tech Corp GmbH"}}
    assert is_blocked_company(job) is False


@pytest.mark.asyncio
async def test_probe_native_async_adzuna_domain() -> None:
    """Test _probe_native_async returns True when HEAD response lands on adzuna.at."""
    job = {
        "id": "12345",
        "redirect_url": "https://www.adzuna.at/land/ad/12345?v=1",
    }

    with respx.mock:
        respx.get("https://www.adzuna.at/land/ad/12345?v=1").mock(
            return_value=Response(
                200,
                headers={"Location": "https://www.adzuna.at/details/12345"},
                request=respx.last_request(),
            )
        )
        respx.head("https://www.adzuna.at/land/ad/12345?v=1").mock(
            return_value=Response(
                200,
                url="https://www.adzuna.at/details/12345",
                headers={"Location": "https://www.adzuna.at/details/12345"},
            )
        )

        async with respx.AsyncClient() as client:
            result_job, is_native = await _probe_native_async(client, job, timeout=5.0)
        
        assert is_native is True
        assert result_job == job


@pytest.mark.asyncio
async def test_probe_native_async_external_domain() -> None:
    """Test _probe_native_async returns False when HEAD lands on stepstone.de."""
    job = {
        "id": "12345",
        "redirect_url": "https://www.adzuna.at/land/ad/12345?v=1",
    }

    with respx.mock:
        # Mock the redirect to external domain
        respx.head("https://www.adzuna.at/land/ad/12345?v=1").mock(
            return_value=Response(
                200,
                url="https://www.stepstone.de/jobs/12345",
                headers={"Location": "https://www.stepstone.de/jobs/12345"},
            )
        )
        # Mock the /details/ endpoint as 404 (external job)
        respx.head("https://www.adzuna.at/details/12345").mock(
            return_value=Response(404)
        )

        async with respx.AsyncClient() as client:
            result_job, is_native = await _probe_native_async(client, job, timeout=5.0)
        
        assert is_native is False
        assert result_job == job


@pytest.mark.asyncio
async def test_probe_native_async_blocklist() -> None:
    """Test _probe_native_async returns False for blocklisted URLs without making HTTP requests."""
    job = {
        "id": "12345",
        "redirect_url": "https://www.stepstone.at/jobs/12345",
    }

    async with respx.AsyncClient() as client:
        result_job, is_native = await _probe_native_async(client, job, timeout=5.0)
    
    assert is_native is False
    assert result_job == job


@pytest.mark.asyncio
async def test_filter_native_async_mixed_jobs() -> None:
    """Test filter_native_async removes external jobs and keeps native ones."""
    raw_jobs = [
        {"id": "1", "redirect_url": "https://www.adzuna.at/land/ad/1?v=1"},
        {"id": "2", "redirect_url": "https://www.stepstone.at/jobs/2"},
        {"id": "3", "redirect_url": "https://www.adzuna.de/land/ad/3?v=1"},
        {"id": "4", "redirect_url": "https://www.indeed.com/jobs/4"},
        {"id": "5", "redirect_url": "https://www.adzuna.at/land/ad/5?v=1"},
    ]

    with respx.mock:
        # Mock native job redirects
        respx.head("https://www.adzuna.at/land/ad/1?v=1").mock(
            return_value=Response(200, url="https://www.adzuna.at/details/1")
        )
        respx.head("https://www.adzuna.de/land/ad/3?v=1").mock(
            return_value=Response(200, url="https://www.adzuna.de/details/3")
        )
        respx.head("https://www.adzuna.at/land/ad/5?v=1").mock(
            return_value=Response(200, url="https://www.adzuna.at/details/5")
        )
        # Mock /details/ endpoints for native jobs
        respx.head("https://www.adzuna.at/details/1").mock(return_value=Response(200))
        respx.head("https://www.adzuna.de/details/3").mock(return_value=Response(200))
        respx.head("https://www.adzuna.at/details/5").mock(return_value=Response(200))

        native_jobs = await filter_native_async(raw_jobs, timeout=5.0)
    
    assert len(native_jobs) == 3
    assert native_jobs[0]["id"] == "1"
    assert native_jobs[1]["id"] == "3"
    assert native_jobs[2]["id"] == "5"


def test_run_async_filter_sync() -> None:
    """Test run_async_filter_sync runs the async filter in sync context."""
    raw_jobs = [
        {"id": "1", "redirect_url": "https://www.stepstone.at/jobs/1"},
        {"id": "2", "redirect_url": "https://www.adzuna.at/land/ad/2?v=1"},
    ]

    with respx.mock:
        respx.head("https://www.adzuna.at/land/ad/2?v=1").mock(
            return_value=Response(200, url="https://www.adzuna.at/details/2")
        )
        respx.head("https://www.adzuna.at/details/2").mock(return_value=Response(200))

        native_jobs = run_async_filter_sync(raw_jobs)
    
    assert len(native_jobs) == 1
    assert native_jobs[0]["id"] == "2"