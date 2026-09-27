"""Google Places API (New) provider -- the primary lead source.

Why this and not scraping google.com/maps HTML: the Maps HTML endpoints violate
Google's Terms of Service, get IP-blocked fast, and break constantly. The Places
API is the sanctioned path and it carries exactly the signals that matter here:

* ``websiteUri``  -- is there a site, and is it a real site or just Facebook?
* ``rating`` / ``userRatingCount`` -- proof the business is good enough to charge
  for a website. A 4.8-star shop with 400 reviews is a far better prospect than
  a brand new listing with 3 reviews, and the pitch can cite real numbers.
* ``primaryType``  -- reliable industry classification.

Requires ``GOOGLE_PLACES_API_KEY`` with the *Places API (New)* enabled. New
accounts get a monthly credit that is more than enough for local prospecting.

Quota etiquette: pageSize is capped at 20, at most 3 pages per query (60 results),
and the response must include a field mask or the request is rejected.
"""

from __future__ import annotations

import time

from .base import RawLead
from ..config import CONFIG
from ..http_client import CACHE, ScrapeError, normalize_url, request

NAME = "google_places"
ENDPOINT = "https://places.googleapis.com/v1/places:searchText"

FIELDS = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.primaryType",
        "places.googleMapsUri",
        "places.businessStatus",
        "nextPageToken",
    ]
)

# Google primaryType -> our normalized industry
TYPE_MAP: dict[str, str] = {
    "plumber": "Plumbing",
    "drain_cleaning_service": "Plumbing",
    "water_heater": "Plumbing",
    "sewer_cleaning_service": "Plumbing",
    "roofing_contractor": "Roofing",
    "roofing": "Roofing",
    "siding_contractor": "Roofing",
    "gutter_drainage_service": "Roofing",
    "general_contractor": "Roofing",
    "car_repair": "Automotive",
    "auto_body_shop": "Automotive",
    "transmission_repair": "Automotive",
    "tire_shop": "Automotive",
    "oil_change_station": "Automotive",
    "car_detailing": "Automotive",
    "car_wash": "Automotive",
    "towing_service": "Automotive",
    "auto_glass_repair": "Automotive",
    "motorcycle_dealer": "Automotive",
    "hvac_contractor": "HVAC",
    "air_conditioning_repair": "HVAC",
    "heating_contractor": "HVAC",
    "electrician": "Electrical",
    "electrical_contractor": "Electrical",
    "solar_and_photovoltaic_solar_heating_store": "Solar",
    "solar_energy_contractor": "Solar",
    "landscaping_service": "Landscaping",
    "lawn_care_service": "Landscaping",
    "tree_service": "Landscaping",
    "gardener": "Landscaping",
    "concrete_contractor": "Concrete",
    "moving_company": "Moving",
    "junk_removal_service": "Moving",
    "locksmith": "Locksmith",
    "pest_control_service": "Pest Control",
    "house_cleaning_service": "Cleaning",
    "window_cleaning_service": "Cleaning",
    "dentist": "Dental",
    "orthodontist": "Dental",
    "periodontist": "Dental",
    "endodontist": "Dental",
    "chiropractor": "Chiropractic",
    "physical_therapy_clinic": "Healthcare",
    "physiotherapist": "Healthcare",
    "veterinarian": "Veterinary",
    "pet_care": "Veterinary",
    "restaurant": "Restaurant",
    "cafe": "Restaurant",
    "bakery": "Restaurant",
    "bar": "Restaurant",
    "meal_takeaway": "Restaurant",
    "gym": "Fitness",
    "yoga_studio": "Fitness",
    "pilates_studio": "Fitness",
    "barber_shop": "Personal Care",
    "hair_salon": "Personal Care",
    "nail_salon": "Personal Care",
    "spa": "Personal Care",
    "dry_cleaning_service": "Personal Care",
    "florist": "Retail",
    "furniture_store": "Retail",
    "mattress_store": "Retail",
    "home_goods_store": "Retail",
    "appliance_repair_service": "Appliance",
    "real_estate_agency": "Real Estate",
    "accounting": "Professional Services",
    "lawyer": "Professional Services",
    "insurance_agency": "Professional Services",
    "self_storage_camping": "Storage",
    "storage": "Storage",
    "flooring_contractor": "Flooring",
    "carpet_rug_cleaning_service": "Flooring",
    "swimming_pool_contractor": "Pool",
    "general_contractor": "General",
    "handyman": "General",
}


def _map_type(primary_type: str | None, fallback: str) -> str:
    if not primary_type:
        return fallback
    return TYPE_MAP.get(primary_type, fallback)


def available() -> bool:
    return CONFIG.has_google()


def _headers() -> dict[str, str]:
    return {
        # The shared session drops Accept, so state it here.
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Goog-Api-Key": CONFIG.google_api_key,
        "X-Goog-FieldMask": FIELDS,
    }


def _search_one(text_query: str) -> tuple[list[dict], str | None, str | None]:
    """Run a single text search (all pages). Returns (places, next_token, error)."""
    places: list[dict] = []
    page_token: str | None = None
    pages = 0

    while pages < CONFIG.places_max_pages:
        body: dict = {"textQuery": text_query, "pageSize": 20}
        if page_token:
            body["pageToken"] = page_token

        cache_key = f"places:{text_query}:{page_token or 'first'}"
        cached = CACHE.get(cache_key) if CONFIG.use_cache else None
        if cached is not None:
            payload = cached
        else:
            try:
                resp = request(
                    "POST",
                    ENDPOINT,
                    json=body,
                    headers=_headers(),
                    timeout=CONFIG.request_timeout,
                    use_cache=False,
                )
            except ScrapeError as exc:
                msg = str(exc)
                if "403" in msg:
                    return places, None, (
                        "HTTP 403 -- API key rejected, or 'Places API (New)' is not "
                        "enabled for this key. Enable it in Google Cloud Console."
                    )
                if "429" in msg:
                    return places, None, "HTTP 429 -- quota exhausted."
                return places, None, msg

            if resp.status_code != 200:
                detail = resp.text[:300]
                return places, None, f"HTTP {resp.status_code}: {detail}"
            payload = resp.json()
            if CONFIG.use_cache:
                CACHE.set(cache_key, payload)

        batch = payload.get("places", []) or []
        places.extend(batch)
        pages += 1
        page_token = payload.get("nextPageToken")
        if not page_token:
            break
        # Google asks for a short pause between paged requests.
        time.sleep(0.4)

    return places, None, None


def fetch(market, trades) -> list[RawLead]:
    """Run one text search per trade, scoped to the market's region."""
    leads: list[RawLead] = []
    queries_run = 0
    errors: list[str] = []

    for query_fragment, industry, _osm_tag in trades:
        if CONFIG.max_queries and queries_run >= CONFIG.max_queries:
            if CONFIG.verbose:
                print(f"  ! max_queries={CONFIG.max_queries} reached, stopping early")
            break

        text_query = f"{query_fragment} in {market.region}"
        queries_run += 1

        places, _next, err = _search_one(text_query)
        if err:
            errors.append(err)
            if CONFIG.verbose:
                print(f"  ! {text_query}: {err}")
            # Auth/quota failures will repeat for every query; bail early.
            if "403" in err or "429" in err:
                break
            continue

        for place in places:
            lead = _to_lead(place, industry, market, text_query)
            if lead:
                leads.append(lead)

        if CONFIG.verbose:
            print(f"  + {text_query}: {len(places)} results")

        time.sleep(0.2)  # be gentle

    if errors and CONFIG.verbose:
        print(f"  ! {len(errors)} query errors; first: {errors[0]}")
    return leads


def _to_lead(place: dict, industry: str, market, text_query: str) -> RawLead | None:
    status = (place.get("businessStatus") or "").upper()
    if status in ("CLOSED_PERMANENTLY", "CLOSED_TEMPORARILY"):
        return None

    name = ((place.get("displayName") or {}).get("text") or "").strip()
    if not name:
        return None

    website = normalize_url(place.get("websiteUri") or "")
    location = place.get("location") or {}
    address = place.get("formattedAddress") or ""

    return RawLead(
        name=name,
        industry=_map_type(place.get("primaryType"), industry),
        address=address,
        phone=(place.get("nationalPhoneNumber") or "").strip(),
        website=website,
        rating=place.get("rating"),
        review_count=place.get("userRatingCount"),
        source=NAME,
        source_id=place.get("id", ""),
        lat=location.get("latitude"),
        lon=location.get("longitude"),
        raw={
            "googleMapsUri": place.get("googleMapsUri", ""),
            "primaryType": place.get("primaryType", ""),
            "businessStatus": status,
            "market": market.name,
            "query": text_query,
            "low_confidence": False,
        },
    )


def reviews_summary(place_id: str) -> dict:
    """Optional: pull the 5 most recent reviews for a place.

    Useful because a stream of angry 1-star reviews mentioning "no website" or
    "couldn't even find you" is legitimate, checkable evidence for a pitch --
    as opposed to inventing a customer complaint, which is what the old
    parse_leads.py did and which would fall apart the moment a prospect replied
    with "which client said that?"
    """
    if not CONFIG.has_google() or not place_id:
        return {}
    url = f"https://places.googleapis.com/v1/places/{place_id}/reviews"
    try:
        resp = request(
            "GET",
            url,
            headers={"Accept": "application/json",
                     "X-Goog-Api-Key": CONFIG.google_api_key},
            params={"pageSize": 5, "sortOrder": "newest"},
            timeout=CONFIG.request_timeout,
        )
    except ScrapeError:
        return {}
    if resp.status_code != 200:
        return {}
    data = resp.json()
    out = []
    for r in data.get("reviews", []):
        out.append(
            {
                "rating": r.get("rating"),
                "text": (r.get("text", {}) or {}).get("text", "")[:400],
                "author": (r.get("authorAttribution", {}) or {}).get("displayName", ""),
            }
        )
    return {"reviews": out}
