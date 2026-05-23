from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.jobs.schemas import ExternalJobSearchRequest


class BaseJobProvider(ABC):
    @abstractmethod
    def search(self, request: ExternalJobSearchRequest) -> list[dict[str, Any]]:
        ...


def get_job_client(source: str) -> BaseJobProvider:
    from app.jobs.adzuna_client import AdzunaClient
    from app.jobs.arbeitnow_client import ArbeitnowClient
    from app.jobs.jooble_client import JoobleClient

    clients: dict[str, type[BaseJobProvider]] = {
        "adzuna": AdzunaClient,
        "arbeitnow": ArbeitnowClient,
        "jooble": JoobleClient,
    }

    client_cls = clients.get(source, AdzunaClient)
    return client_cls()
