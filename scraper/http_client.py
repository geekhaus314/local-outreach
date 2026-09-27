"""Hardened HTTP layer.

Three things here are not optional, they are the difference between working and
not working against public endpoints:

1. ``Accept-Encoding: identity`` -- Overpass sits behind an Apache config that
   returns ``406 Not Acceptable`` for any request advertising gzip/deflate/br.
   This was found empirically, not documented anywhere.
2. Retry + backoff -- Overpass regularly returns 504/429 under load and will
   fail a naive scraper for no reason.
3. SSRF guards on outbound fetches -- the auditor follows URLs that came from
   third-party scraped data. Without validation a malicious listing could point
   us at internal addresses.
"""

from __future__ import annotations

import hashlib
import ipaddress
import json
import random
import socket
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse

import requests

from .config import CACHE_DIR, CONFIG

RETRYABLE_STATUS = {408, 425, 429, 500, 502, 503, 504, 406}
MAX_REDIRECTS = 5
MAX_BODY_BYTES = 3_000_000  # 3 MB is plenty for a marketing site


class ScrapeError(RuntimeError):
    """Raised when a request cannot be completed after all retries."""


# --------------------------------------------------------------------------- #
# SSRF protection
# --------------------------------------------------------------------------- #
def _is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    if addr.version == 6:
        # Unwrap IPv4-mapped IPv6 (::ffff:1.2.3.4)
        mapped = addr.ipv4_mapped or addr.sixtofour or addr.teredo
        if mapped is not None:
            return _is_public_ip(str(mapped))
        if addr.is_loopback or addr.is_link_local or addr.is_private or addr.is_reserved:
            return False
        if addr in ipaddress.ip_network("fc00::/7") or addr in ipaddress.ip_network("fe80::/10"):
            return False
        return True
    return not (
        addr.is_private or addr.is_loopback or addr.is_link_local
        or addr.is_reserved or addr.is_multicast or addr.is_unspecified
    )


def assert_public_url(url: str) -> None:
    """Reject anything that is not a public http(s) URL.

    Raises ValueError on a private/loopback/link-local target.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"blocked scheme: {parsed.scheme!r}")
    host = parsed.hostname
    if not host:
        raise ValueError("no host in url")
    if host.lower() in ("localhost", "localhost.localdomain", "ip6-localhost"):
        raise ValueError("blocked host: localhost")
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        addr = None  # normal DNS name, checked below
    if addr is not None:
        if not _is_public_ip(str(addr)):
            raise ValueError(f"blocked literal IP: {host}")
        return
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise ValueError(f"DNS failure for {host}: {exc}") from exc
    for info in infos:
        ip = info[4][0]
        if not _is_public_ip(ip):
            raise ValueError(f"host {host} resolves to non-public {ip}")


# --------------------------------------------------------------------------- #
# Cache
# --------------------------------------------------------------------------- #
@dataclass
class _CacheEntry:
    path: Path
    age_hours: float


class DiskCache:
    """Tiny JSON cache so re-runs are cheap and polite to public APIs."""

    def __init__(self, root: Path = CACHE_DIR, ttl_hours: int = 24):
        self.root = root
        self.ttl = ttl_hours * 3600
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:32]
        return self.root / f"{digest}.json"

    def get(self, key: str) -> Any | None:
        path = self._path(key)
        if not path.exists():
            return None
        if time.time() - path.stat().st_mtime > self.ttl:
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None

    def set(self, key: str, value: Any) -> None:
        try:
            self._path(key).write_text(
                json.dumps(value, ensure_ascii=False), encoding="utf-8"
            )
        except (OSError, TypeError):
            pass  # cache is best-effort


CACHE = DiskCache(ttl_hours=CONFIG.cache_ttl_hours)


# --------------------------------------------------------------------------- #
# Session
# --------------------------------------------------------------------------- #
def build_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": CONFIG.user_agent,
            # See module docstring: gzip triggers 406 on Overpass, and a
            # Chrome-like User-Agent triggers 406 as well.
            "Accept-Encoding": "identity",
            "Connection": "close",
        }
    )
    # requests injects `Accept: */*` by default. Empirically, Overpass serves
    # far more reliably when that header is absent, so drop it. Endpoints that
    # need it (Google) set it explicitly on their own request.
    s.headers.pop("Accept", None)
    return s


SESSION = build_session()


def _sleep_backoff(attempt: int, cap: int = 30) -> None:
    # Exponential backoff with jitter to avoid thundering herds.
    delay = min(2**attempt, cap) * (0.6 + random.random() * 0.6)
    time.sleep(delay)


def request(
    method: str,
    url: str,
    *,
    retries: int | None = None,
    timeout: int | None = None,
    backoff_cap: int = 30,
    use_cache: bool = True,
    cache_key: str | None = None,
    **kwargs: Any,
) -> requests.Response:
    """Perform a request with retries, backoff and optional disk caching."""
    retries = CONFIG.max_retries if retries is None else retries
    timeout = timeout or CONFIG.request_timeout
    key = cache_key or f"{method}:{url}:{sorted(kwargs.items())!r}"

    if use_cache and CONFIG.use_cache and method == "GET":
        cached = CACHE.get(key)
        if cached is not None:
            resp = requests.Response()
            resp.status_code = 200
            resp._content = json.dumps(cached).encode("utf-8")
            resp.url = url
            resp.headers["X-Scraper-Cache"] = "hit"
            return resp

    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            resp = SESSION.request(method, url, timeout=timeout, **kwargs)
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < retries - 1:
                _sleep_backoff(attempt, backoff_cap)
                continue
            raise ScrapeError(f"{method} {url} failed: {exc}") from exc

        if resp.status_code in RETRYABLE_STATUS:
            if attempt < retries - 1:
                if resp.status_code == 429:
                    time.sleep(
                        min(backoff_cap, 2**attempt * 5) * (0.6 + random.random())
                    )
                else:
                    _sleep_backoff(attempt, backoff_cap)
                continue
            raise ScrapeError(
                f"{method} {url} -> HTTP {resp.status_code} after {retries} attempts"
            )

        if use_cache and CONFIG.use_cache and method == "GET" and resp.ok:
            try:
                CACHE.set(key, resp.json())
            except ValueError:
                pass
        return resp

    raise ScrapeError(f"{method} {url} exhausted retries: {last_exc}")


# --------------------------------------------------------------------------- #
# Safe page fetch (used by the auditor)
# --------------------------------------------------------------------------- #
@dataclass
class PageResult:
    url: str
    final_url: str
    status: int | None = None
    html: str = ""
    error: str | None = None
    elapsed_ms: int | None = None
    redirect_chain: list[str] | None = None
    truncated: bool = False

    @property
    def ok(self) -> bool:
        return self.error is None and self.status is not None and self.status < 400


def fetch_page(url: str, timeout: int | None = None) -> PageResult:
    """Fetch a page for auditing. SSRF-checked, size-capped, redirect-limited.

    Redirects are followed manually so every hop is re-validated.
    """
    timeout = timeout or CONFIG.audit_timeout
    result = PageResult(url=url, final_url=url, redirect_chain=[])

    current = url
    for _ in range(MAX_REDIRECTS + 1):
        try:
            assert_public_url(current)
        except ValueError as exc:
            result.error = f"blocked: {exc}"
            return result

        started = time.monotonic()
        try:
            resp = SESSION.request(
                "GET",
                current,
                timeout=timeout,
                allow_redirects=False,
                stream=True,
            )
        except requests.RequestException as exc:
            result.error = f"{type(exc).__name__}: {exc}"
            return result

        result.status = resp.status_code
        result.final_url = current
        result.elapsed_ms = int((time.monotonic() - started) * 1000)

        if resp.is_redirect or resp.is_permanent_redirect:
            location = resp.headers.get("Location", "")
            resp.close()
            if not location:
                result.error = "redirect without Location header"
                return result
            nxt = requests.compat.urljoin(current, location)
            result.redirect_chain.append(nxt)
            current = nxt
            continue

        # Read a bounded amount of body.
        chunks: list[bytes] = []
        total = 0
        try:
            for chunk in resp.iter_content(chunk_size=16384):
                if not chunk:
                    continue
                chunks.append(chunk)
                total += len(chunk)
                if total >= MAX_BODY_BYTES:
                    result.truncated = True
                    break
        except requests.RequestException as exc:
            result.error = f"read error: {exc}"
            return result
        finally:
            resp.close()

        encoding = resp.encoding or "utf-8"
        try:
            result.html = b"".join(chunks).decode(encoding, errors="replace")
        except (LookupError, UnicodeDecodeError):
            result.html = b"".join(chunks).decode("utf-8", errors="replace")
        return result

    result.error = "too many redirects"
    return result


def head_ok(url: str, timeout: int = 8) -> PageResult:
    """Cheap reachability probe used for triage mode."""
    try:
        assert_public_url(url)
    except ValueError as exc:
        return PageResult(url=url, final_url=url, error=f"blocked: {exc}")
    try:
        resp = SESSION.request(
            "HEAD", url, timeout=timeout, allow_redirects=True, stream=True
        )
        status, final = resp.status_code, resp.url
        resp.close()
        return PageResult(url=url, final_url=final, status=status)
    except requests.RequestException as exc:
        return PageResult(url=url, final_url=url, error=f"{type(exc).__name__}: {exc}")


def normalize_url(url: str) -> str:
    """Strip scheme noise and tracking params so dedupe compares cleanly.

    Returns "" for anything that is not http(s). URLs come from third-party
    scraped data, so a ``javascript:`` or ``data:`` value must be rejected
    outright rather than being helpfully prefixed into a fetchable https URL.
    """
    if not url:
        return ""
    url = url.strip()
    if not url:
        return ""
    if url.startswith(("http://", "https://")):
        pass
    elif "://" in url or url.lower().startswith(
        ("javascript:", "data:", "mailto:", "tel:", "file:", "about:", "vbscript:")
    ):
        return ""
    else:
        url = "https://" + url.lstrip("/")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return ""
    host = (parsed.hostname or "").lower()
    if not host or "." not in host:
        return ""
    if host.startswith("www."):
        host = host[4:]
    path = parsed.path.rstrip("/") or "/"
    return urlunparse((parsed.scheme, host, path, "", "", ""))


def registrable_domain(url_or_host: str) -> str:
    """Approximate eTLD+1 so a.com and www.a.com collapse to one lead."""
    host = url_or_host
    if "//" in host:
        host = urlparse(host).hostname or ""
    host = host.lower().strip(".")
    if host.startswith("www."):
        host = host[4:]
    if not host:
        return ""
    try:
        import ipaddress

        ipaddress.ip_address(host)
        return host
    except ValueError:
        pass
    parts = host.split(".")
    if len(parts) <= 2:
        return host
    # Handle common two-part public suffixes without pulling in tldextract.
    two_part = {"co.uk", "com.au", "co.nz", "com.br", "co.uk", "com.mx"}
    if ".".join(parts[-2:]) in two_part and len(parts) >= 3:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])
