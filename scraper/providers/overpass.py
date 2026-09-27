"""Free OpenStreetMap provider via the Overpass API.

Caveat worth repeating: OSM coverage of US local businesses is thin. In testing,
the whole Florissant MO area returned 9 named commercial records. Treat this as a
free seed/supplement, not a lead list. Critically, a *missing* ``website`` tag
means "nobody added it", NOT "this business has no website" -- so leads from
here are marked ``low_confidence`` and must be audited before you believe them.
"""

from __future__ import annotations

from .base import RawLead
from ..config import CHAIN_BLOCKLIST, CONFIG, PARKED_MARKERS, SOCIAL_HOSTS
from ..http_client import CACHE, ScrapeError, normalize_url, request

NAME = "overpass"

# Value-whitelisted tag selectors.
#
# These are deliberately restrictive. Key-only selectors such as nwr["leisure"]
# drag in every park, sports pitch and nature reserve in the bounding box -- an
# early run returned "Jean Baptist Point Dusable Park" and "Big Muddy National
# Fish and Wildlife Area" as leads. Whitelisting the values keeps this to things
# that actually sell something.
#
# Each entry carries the industries it can possibly produce, so a run scoped to
# trades (--industries Plumbing,Roofing) skips the healthcare/leisure/amenity
# queries entirely. That roughly halves the query count, and Overpass query
# count is what makes this slow.
TAG_FILTERS: list[tuple[str, frozenset[str]]] = [
    ('nwr["craft"~"^(plumber|roofer|siding|hvac|electrical|car_repair|body_shop|'
     'car_detailer|tyre_repair|towing|motorcycle|landscaper|landscape_gardener|'
     'tree_surgeon|fence|concrete|excavator|painter|glaziery|locksmith|'
     'pest_control|cleaner|appliance_repair|solar|upholsterer|photographer|'
     'electronics_repair|boatbuilder|wheelwright|blacksmith|carpenter|joinery|'
     'plasterer|stone_mason|window_manufacturer|window_builder)$"]["name"]',
     frozenset({"Plumbing", "Roofing", "HVAC", "Electrical", "Automotive",
                "Landscaping", "Concrete", "Painting", "Locksmith",
                "Pest Control", "Cleaning", "Appliance", "Solar", "Windows",
                "Flooring", "General", "Personal Care"})),

    ('nwr["shop"~"^(car_repair|car_detailer|tyre_repair|motorcycle|beauty|'
     'hairdresser|nail_salon|tattoo|laundry|dry_cleaning|bakery|florist|'
     'furniture|bed|carpet|trade|hardware|doityourself|garden_centre|'
     'building_materials|paint|veterinary|optician|photo|printing|'
     'shoes|repair|electronics|jewelry|watch|'
     'storage|floor|ceiling_tiles|curtain|upholstery|boat|caravan)$"]["name"]',
     frozenset({"Automotive", "Personal Care", "Restaurant", "Retail",
                "Veterinary", "Windows", "Flooring", "Storage", "General",
                "Plumbing", "Landscaping", "Concrete", "Painting", "Cleaning",
                "Dental", "Fitness"})),

    ('nwr["healthcare"~"^(dentist|orthodontist|periodontist|endodontist|'
     'chiropractor|physiotherapist|optometrist|veterinary|surgeon|'
     'podiatrist|midwife|psychotherapist)$"]["name"]',
     frozenset({"Dental", "Chiropractic", "Healthcare", "Veterinary"})),

    ('nwr["leisure"~"^(fitness_centre|sports_centre|yoga|swimming_pool|'
     'bowling_alley|sauna|martial_arts|dance|climbing|boxing)$"]["name"]',
     frozenset({"Fitness", "Pool"})),

    ('nwr["amenity"~"^(restaurant|cafe|bar|fast_food|ice_cream|'
     'driving_school|car_wash|taxi|funeral_director)$"]["name"]',
     frozenset({"Restaurant", "Automotive", "Moving", "General"})),

    ('nwr["office"~"^(estate_agent|accountant|lawyer|insurance|company|'
     'financial|tax_advisor|architect|surveyor|'
     'advertising_agency|employment_agency)$"]["name"]',
     frozenset({"Real Estate", "Professional Services", "General"})),
]

# Mirrors that have failed consecutively get benched for the rest of the run.
# Without this a single flaky endpoint turns a 3-minute job into a 20-minute one.
_DEAD_MIRRORS: dict[str, int] = {}

INDUSTRY_BY_TAG: dict[str, str] = {
    "craft=plumber": "Plumbing",
    "craft=roofer": "Roofing",
    "craft=siding": "Roofing",
    "craft=car_repair": "Automotive",
    "craft=body_shop": "Automotive",
    "craft=car_detailer": "Automotive",
    "craft=tyre_repair": "Automotive",
    "craft=towing": "Automotive",
    "craft=motorcycle": "Automotive",
    "craft=hvac": "HVAC",
    "craft=electrical": "Electrical",
    "craft=landscaper": "Landscaping",
    "craft=tree_surgeon": "Landscaping",
    "craft=fence": "Landscaping",
    "craft=concrete": "Concrete",
    "craft=excavator": "Concrete",
    "craft=painter": "Painting",
    "craft=locksmith": "Locksmith",
    "craft=pest_control": "Pest Control",
    "craft=cleaner": "Cleaning",
    "craft=appliance_repair": "Appliance",
    "craft=solar": "Solar",
    "craft=window_manufacturer": "Windows",
    "craft=window_builder": "Windows",
    "shop=veterinary": "Veterinary",
    "shop=bakery": "Restaurant",
    "shop=florist": "Retail",
    "shop=furniture": "Retail",
    "shop=bed": "Retail",
    "shop=hairdresser": "Personal Care",
    "shop=laundry": "Personal Care",
    "shop=carpet": "Flooring",
    "shop=storage": "Storage",
    "healthcare=dentist": "Dental",
    "healthcare=orthodontist": "Dental",
    "healthcare=chiropractor": "Chiropractic",
    "healthcare=physiotherapist": "Healthcare",
    "office=estate_agent": "Real Estate",
    "office=accountant": "Professional Services",
    "office=lawyer": "Professional Services",
    "office=insurance": "Professional Services",
    "leisure=fitness_centre": "Fitness",
    "leisure=yoga": "Fitness",
    "leisure=swimming_pool": "Pool",
    "amenity=restaurant": "Restaurant",
    "amenity=cafe": "Restaurant",
    "amenity=bar": "Restaurant",
    "amenity=fast_food": "Restaurant",
    "amenity=pharmacy": "Retail",
    "amenity=bank": "Professional Services",
    "emergency=yes": "Emergency Services",
}


def _guess_industry(tags: dict) -> str:
    for key in (
        "craft", "shop", "office", "healthcare", "leisure",
        "amenity", "emergency", "office:category",
    ):
        val = tags.get(key)
        if val and f"{key}={val}" in INDUSTRY_BY_TAG:
            return INDUSTRY_BY_TAG[f"{key}={val}"]
    return "General"


def _is_parked(url: str) -> bool:
    if not url:
        return False
    low = url.lower()
    return any(m in low for m in ("afternic", "sedoparking", "dan.com", "hugedomains"))


def _is_chain(name: str) -> bool:
    """Reject national chains and franchises.

    Matched as a substring against the lowercased name, so "Walmart Pharmacy"
    and "Midas Muffler" are both caught. Sole traders named "Delta Plumbing" are
    not, which is the behaviour we want.
    """
    low = name.lower()
    if low.startswith("(former)") or low.startswith("(closed)"):
        return True
    return any(token in low for token in CHAIN_BLOCKLIST)


def available() -> bool:
    return bool(CONFIG.overpass_endpoints)


def fetch(market, trades=None) -> list[RawLead]:
    south, west, north, east = market.bbox

    # Respect the caller's industry scope. The OSM fallback otherwise returns
    # whatever happens to be mapped in the bbox, which in practice means mostly
    # restaurants and cafes.
    allowed_industries = {t[1] for t in trades} if trades else None

    filters = TAG_FILTERS
    if allowed_industries:
        filters = [
            (sel, inds) for sel, inds in TAG_FILTERS
            if inds & allowed_industries
        ]
        skipped = len(TAG_FILTERS) - len(filters)
        if skipped and CONFIG.verbose:
            print(f"    {len(filters)}/{len(TAG_FILTERS)} tag queries relevant "
                  f"to the requested industries ({skipped} skipped)")

    # One big combined query reliably 504s on Overpass. Issuing one query per
    # tag group keeps each cheap and means a partial failure still yields data.
    seen: set[str] = set()
    leads: list[RawLead] = []

    for tag_filter, _inds in filters:
        query = f"""
[out:json][timeout:90];
{tag_filter}["name"]({south},{west},{north},{east});
out center 600;
"""
        cache_key = f"overpass:{tag_filter}:{market.bbox}"
        data = None
        if CONFIG.use_cache:
            data = CACHE.get(cache_key)
        if data is None:
            data = _run_query(query, f"{market.name}/{tag_filter}")
            if data and CONFIG.use_cache:
                CACHE.set(cache_key, data)
        if not data:
            continue

        for el in data.get("elements", []):
            lead = _to_lead(el)
            if lead is None or lead.source_id in seen:
                continue
            if allowed_industries and lead.industry not in allowed_industries:
                continue
            seen.add(lead.source_id)
            leads.append(lead)

    return leads


def _to_lead(el: dict) -> RawLead | None:
    tags = el.get("tags") or {}
    name = (tags.get("name") or "").strip()
    if len(name) < 3:
        return None
    # Not a business: parks, reserves, monuments, schools, government.
    if tags.get("leisure") in ("park", "garden", "nature_reserve", "pitch",
                               "track", "stadium", "playground", "dog_park",
                               "common", "recreation_ground", "fitness_station"):
        return None
    if tags.get("landuse") or tags.get("boundary") == "administrative":
        return None
    if tags.get("tourism") in ("attraction", "museum", "artwork", "viewpoint",
                               "zoo", "theme_park", "gallery"):
        return None
    if tags.get("amenity") in ("school", "university", "college", "library",
                               "place_of_worship", "community_centre",
                               "parking", "fuel", "bank", "pharmacy",
                               "grave_yard", "bus_station", "post_office"):
        return None
    if tags.get("shop") in ("supermarket", "department_store", "convenience",
                            "variety_store", "books", "confectionery",
                            "alcohol", "wine", "general", "kiosk", "newsagent"):
        return None
    if tags.get("office") in ("government", "city_state", "company") and not tags.get(
        ("craft", "shop", "healthcare", "leisure", "tourism")
    ):
        return None
    if _is_chain(name):
        return None

    website = (
        tags.get("website")
        or tags.get("contact:website")
        or tags.get("url")
        or tags.get("contact:url")
        or ""
    )
    website = normalize_url(website)
    phone = (
        tags.get("phone")
        or tags.get("contact:phone")
        or tags.get("contact:mobile")
        or ""
    )
    street = tags.get("addr:street", "")
    housenum = tags.get("addr:housenumber", "")
    city = tags.get("addr:city", "")
    postcode = tags.get("addr:postcode", "")
    address = " ".join(p for p in (housenum, street, city, postcode) if p).strip()

    if _is_parked(website):
        website = ""

    center = el.get("center") or {}
    return RawLead(
        name=name,
        industry=_guess_industry(tags),
        address=address,
        phone=phone.strip(),
        website=website,
        source=NAME,
        source_id=f"{el.get('type')}/{el.get('id')}",
        lat=el.get("lat", center.get("lat")),
        lon=el.get("lon", center.get("lon")),
        raw={
            "osm_tags": tags,
            "social_only": any(h in (website or "") for h in SOCIAL_HOSTS),
            "parked": _is_parked(website),
            "low_confidence": True,
        },
    )


def _run_query(query: str, label: str) -> dict:
    """Try each mirror in turn; Overpass mirrors fail individually and often.

    Overpass returns 504 under load constantly. Retrying all three mirrors for
    every query makes a run crawl, so a mirror that fails twice is benched for
    the remainder of the process and reported once.
    """
    last: Exception | None = None
    for endpoint in CONFIG.overpass_endpoints:
        if _DEAD_MIRRORS.get(endpoint, 0) >= 2:
            continue
        try:
            resp = request(
                "POST",
                endpoint,
                data={"data": query},
                # A bounded bbox query should return in seconds. Overpass holds
                # the connection open far longer than that when overloaded, so a
                # 120s timeout per retry turned this provider into a 20-minute
                # job. Fail fast, bench the mirror, and let the disk cache pick
                # the data up on the next run.
                timeout=45,
                retries=2,
                backoff_cap=5,
                use_cache=False,
            )
            if resp.status_code == 200:
                _DEAD_MIRRORS.pop(endpoint, None)
                return resp.json()
            last = ScrapeError(f"{endpoint} -> HTTP {resp.status_code}")
        except (ScrapeError, ValueError) as exc:
            last = exc
        _DEAD_MIRRORS[endpoint] = _DEAD_MIRRORS.get(endpoint, 0) + 1
        if CONFIG.verbose:
            print(f"    overpass mirror failed: {endpoint} ({last})")

    if CONFIG.verbose:
        print(f"    no overpass mirror available for {label}: {last}")
    return {}


def find_place(lat: float, lon: float, name: str) -> list[dict]:
    """Reverse-geocode a lead into a review/photo source. Best effort, optional.

    Overpass alone cannot tell you whether a business has 200 Google reviews,
    which is the strongest 'they can afford a site' signal. This returns any
    OSM-linked social/review data it can find, or an empty list.
    """
    if lat is None or lon is None:
        return []
    query = f"""
[out:json][timeout:60];
nwr(around:60,{lat},{lon})["name"];
out center 30;
"""
    data = _run_query(query, name)
    return data.get("elements", []) if data else []
