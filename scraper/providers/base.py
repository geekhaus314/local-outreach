"""Provider interface shared by all data sources."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Protocol


@dataclass
class RawLead:
    """A business as returned by a provider, before any auditing or scoring."""

    name: str
    industry: str
    address: str = ""
    phone: str = ""
    website: str = ""
    # reputation signals, when the source has them
    rating: float | None = None
    review_count: int | None = None
    # provenance
    source: str = ""
    source_id: str = ""
    lat: float | None = None
    lon: float | None = None
    raw: dict = field(default_factory=dict, repr=False)

    def key(self) -> str:
        return f"{self.source}:{self.source_id}" if self.source_id else self.name.lower()

    def to_dict(self) -> dict:
        return asdict(self)


class Provider(Protocol):
    name: str

    def available(self) -> bool:
        """Can this provider run right now (credentials, network, etc.)?"""

    def fetch(self, market, trades) -> list[RawLead]:
        """Return leads for a market across the given trades."""
