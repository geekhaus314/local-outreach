"""Configuration for the local lead scraper.

Everything tunable lives here. Secrets come from the environment, never hardcoded.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
CACHE_DIR = DATA_DIR / "cache"
LEADS_CSV = ROOT / "leads.csv"

# Load .env by hand so we do not depend on python-dotenv being installed.
def _load_dotenv(path: Path = ROOT / ".env") -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip("'\"")
        os.environ.setdefault(key, val)


_load_dotenv()


@dataclass(frozen=True)
class Market:
    """A geographic market to harvest."""

    name: str
    # (south, west, north, east) - used by the Overpass provider
    bbox: tuple[float, float, float, float]
    # Free-form region hint appended to text-search queries
    region: str


# Home market is St. Louis County / Florissant MO. Add more as needed.
MARKETS: list[Market] = [
    Market("Florissant", (38.7800, -90.4800, 38.8300, -90.4000), "Florissant, MO 63033"),
    Market("Bridgeton", (38.7100, -90.4400, 38.7700, -90.3600), "Bridgeton, MO 63044"),
    Market("Hazelwood", (38.7100, -90.3800, 38.7900, -90.3000), "Hazelwood, MO 63042"),
    Market("St. Ann", (38.6700, -90.4900, 38.7300, -90.4000), "St. Ann, MO 63114"),
    Market("Berkeley", (38.7500, -90.3500, 38.8100, -90.2800), "Berkeley, MO 63134"),
    Market("Maryland Heights", (38.7100, -90.4900, 38.7900, -90.4000), "Maryland Heights, MO 63043"),
    Market("Creve Coeur", (38.7400, -90.5600, 38.8100, -90.4600), "Creve Coeur, MO 63141"),
    Market("Kirkwood", (38.5700, -90.4200, 38.6200, -90.3300), "Kirkwood, MO 63122"),
    Market("Chesterfield", (38.6400, -90.6200, 38.7100, -90.4800), "Chesterfield, MO 63017"),
    Market("Ballwin", (38.5900, -90.5300, 38.6700, -90.4400), "Ballwin, MO 63021"),
    Market("O'Fallon", (38.7900, -90.7500, 38.8700, -90.6700), "O'Fallon, MO 63366"),
    Market("St. Charles", (38.7600, -90.5300, 38.8300, -90.4300), "St. Charles, MO 63301"),
    Market("Wentzville", (38.8000, -90.8100, 38.8800, -90.7200), "Wentzville, MO 63385"),
    Market("Manchester", (38.5500, -90.5300, 38.6100, -90.4400), "Manchester, MO 63011"),
]

# High-ticket local trades where a website directly drives revenue.
# Each entry: (google query fragment, normalized industry, OSM tag selector)
TRADES: list[tuple[str, str, str | None]] = [
    ("plumber", "Plumbing", "craft=plumber"),
    ("emergency plumber", "Plumbing", None),
    ("drain cleaning service", "Plumbing", None),
    ("water heater installation", "Plumbing", None),
    ("sewer cleaning", "Plumbing", None),
    ("roofing contractor", "Roofing", "craft=roofer"),
    ("roof replacement", "Roofing", None),
    ("roof repair", "Roofing", None),
    ("siding contractor", "Roofing", "craft=siding"),
    ("gutter installation", "Roofing", None),
    ("auto repair shop", "Automotive", "craft=car_repair"),
    ("auto body shop", "Automotive", "craft=body_shop"),
    ("transmission repair", "Automotive", None),
    ("brake repair", "Automotive", None),
    ("tire shop", "Automotive", "craft=tyre_repair"),
    ("oil change service", "Automotive", None),
    ("car detailing", "Automotive", "craft=car_detailer"),
    ("towing service", "Automotive", "craft=towing"),
    ("auto glass repair", "Automotive", None),
    ("motorcycle repair", "Automotive", "craft=motorcycle"),
    ("HVAC contractor", "HVAC", "craft=hvac"),
    ("air conditioning repair", "HVAC", None),
    ("furnace repair", "HVAC", None),
    ("heating and cooling company", "HVAC", None),
    ("electrician", "Electrical", "craft=electrical"),
    ("electrical contractor", "Electrical", None),
    ("generator installation", "Electrical", None),
    ("landscaping company", "Landscaping", "craft=landscaper"),
    ("lawn care service", "Landscaping", None),
    ("tree service", "Landscaping", "craft=tree_surgeon"),
    ("concrete contractor", "Concrete", "craft=concrete"),
    ("concrete driveway installation", "Concrete", None),
    ("painting contractor", "Painting", "craft=painter"),
    ("interior painting company", "Painting", None),
    ("fence contractor", "Landscaping", "craft=fence"),
    ("paving and asphalt contractor", "Concrete", None),
    ("excavation contractor", "Concrete", "craft=excavator"),
    ("moving company", "Moving", None),
    ("junk removal service", "Moving", None),
    ("locksmith", "Locksmith", "craft=locksmith"),
    ("pest control service", "Pest Control", "craft=pest_control"),
    ("house cleaning service", "Cleaning", "craft=cleaner"),
    ("commercial cleaning company", "Cleaning", None),
    ("dentist", "Dental", "healthcare=dentist"),
    ("family dentistry", "Dental", None),
    ("orthodontist", "Dental", "healthcare=orthodontist"),
    ("chiropractor", "Chiropractic", "healthcare=chiropractor"),
    ("physical therapy clinic", "Healthcare", "healthcare=physiotherapist"),
    ("veterinarian", "Veterinary", "shop=veterinary"),
    ("animal hospital", "Veterinary", None),
    ("restaurant", "Restaurant", "amenity=restaurant"),
    ("cafe", "Restaurant", "amenity=cafe"),
    ("bakery", "Restaurant", "shop=bakery"),
    ("bar and grill", "Restaurant", None),
    ("gym", "Fitness", "leisure=fitness_centre"),
    ("crossfit gym", "Fitness", None),
    ("yoga studio", "Fitness", "leisure=yoga"),
    ("barber shop", "Personal Care", "shop=hairdresser"),
    ("hair salon", "Personal Care", "shop=hairdresser"),
    ("nail salon", "Personal Care", "shop=massage"),
    ("dry cleaning service", "Personal Care", "shop=laundry"),
    ("florist", "Retail", "shop=florist"),
    ("furniture store", "Retail", "shop=furniture"),
    ("mattress store", "Retail", "shop=bed"),
    ("appliance repair service", "Appliance", "craft=appliance_repair"),
    ("real estate agent", "Real Estate", "office=estate_agent"),
    ("accounting firm", "Professional Services", "office=accountant"),
    ("law firm", "Professional Services", "office=lawyer"),
    ("insurance agency", "Professional Services", "office=insurance"),
    ("storage facility", "Storage", "shop=storage"),
    ("solar panel installer", "Solar", "craft=solar"),
    ("window replacement company", "Windows", "craft=window_manufacturer"),
    ("blinds and shutters", "Windows", None),
    ("flooring contractor", "Flooring", "shop=carpet"),
    ("pool service", "Pool", "leisure=swimming_pool"),
    ("restaurant", "Restaurant", None),
]

# Normalized industry -> role that actually answers the phone / signs the check
DECISION_MAKER_BY_INDUSTRY: dict[str, str] = {
    "Plumbing": "Owner/Operator",
    "Roofing": "Owner/Operator",
    "Automotive": "Shop Manager",
    "HVAC": "Owner/Operator",
    "Electrical": "Owner/Operator",
    "Landscaping": "Owner/Operator",
    "Concrete": "Owner/Operator",
    "Painting": "Owner/Operator",
    "Moving": "Owner/Operator",
    "Locksmith": "Owner/Operator",
    "Pest Control": "Owner/Operator",
    "Cleaning": "Owner/Operator",
    "Dental": "Practice Manager",
    "Chiropractic": "Practice Manager",
    "Healthcare": "Practice Manager",
    "Veterinary": "Practice Manager",
    "Restaurant": "General Manager",
    "Fitness": "Owner/Operator",
    "Personal Care": "Owner/Operator",
    "Retail": "Store Manager",
    "Appliance": "Owner/Operator",
    "Real Estate": "Broker/Owner",
    "Professional Services": "Managing Partner",
    "Storage": "Facility Manager",
    "Solar": "Owner/Operator",
    "Windows": "Owner/Operator",
    "Flooring": "Owner/Operator",
    "Pool": "Owner/Operator",
}

# Hosts that mean "this is not really a website" even though the field is populated.
SOCIAL_HOSTS = (
    "facebook.com", "m.facebook.com", "fb.com", "fb.me", "instagram.com",
    "twitter.com", "x.com", "linktr.ee", "linkin.com", "yelp.com",
    "nextdoor.com", "angi.com", "houzz.com", "bbb.org", "thumbtack.com",
    "yellowpages.com", "mapquest.com", "superpages.com", "bbb.org",
    "tripadvisor.com", "pinterest.com", "tiktok.com", "youtube.com",
    "wa.me", "whatsapp.com", "vimeo.com", "wixsite.com", "weebly.com",
    "godaddysites.com", "business.site", "square.site", "jimdosite.com",
    "blogspot.com", "wordpress.com", "sites.google.com", "mylocal.business",
    "businesses.bloomberg.com", "patch.com", "eventbrite.com", "scribd.com",
)

# Strong, unambiguous evidence of a parked / for-sale / unbuilt domain.
# These are safe to match anywhere on the page.
PARKED_MARKERS = (
    "domain is for sale", "buy this domain", "buy-domain", "domain parking",
    "parked by godaddy", "parked free", "afternic.com", "sedoparking",
    "hugedomains", "dan.com/buy", "cashparking", "dan.com/domain",
    "this domain may be for sale", "inquire about this domain",
    "future home of something quite cool", "domain names for sale",
    "godaddy.com/domainsearch", "this webpage was generated by the domain owner",
    "default web page", "apache2 ubuntu default page", "welcome to nginx!",
    "it works!", "congratulations, you have installed",
)

# Weak signals: only parked if they appear in the <title> or on a page too
# short to be real content. Matching these anywhere produced false positives on
# live sites (a gym whose page happened to say "congratulations").
WEAK_PARKED_MARKERS = (
    "coming soon", "under construction", "site is being built",
    "website coming soon", "page is being built", "launching soon",
    "start your website", "your website is ready", "index of /",
)

# Chains, big-box stores and regional franchises. These will never buy a
# five-page site from a solo developer, and they pollute the list badly.
CHAIN_BLOCKLIST = {
    # big box / retail
    "walmart", "target", "kroger", "aldi", "trader joe", "whole foods", "costco",
    "sam's club", "publix", "meijer", "hy-vee", "schnucks", "shoprite", "wegmans",
    "ace hardware", "home depot", "lowe's", "menards", "mcdonald", "starbucks",
    "subway", "chipotle", "taco bell", "wendy's", "burger king", "popeyes",
    "dunkin", "domino's", "pizza hut", "little caesars", "jack in the box",
    "wendy's", "kfc", "burger", "sonic drive", "jimmy john", "firehouse subs",
    "dairy queen", "hardee's", "waffle house", "ihop", "denny's", "applebee's",
    "chili's", "olive garden", "red lobster", "outback", "texas roadhouse",
    "cheesecake factory", "panera", "caribou coffee", "krispy kreme",
    "baskin robbins", "five guys", "shake shack", "culver's", "whataburger",
    "in-n-out", "raised cane", "zaxby's", "jersey mike's", "wingstop",
    "buffalo wild wings", "quiznos", "cinnabon", "auntie anne's",
    "pizza", "steakhouse", "buffet", "smoothie", "juice bar", "tea house",
    "bubble tea", "internet cafe", "hookah lounge", "adult store",
    "nightclub", "hookah", "smoke shop", "vape shop", "cbd store",
    "tobacco", "liquor store", "beer", "wine bar", "brewery", "taproom",
    "autozone", "o'reilly auto", "napa auto", "advance auto", "pep boys",
    "firestone", "goodyear", "valvoline", "jiffy lube", "midas", "meineke",
    "caliber collision", "dent wizard", "americas best", "united pacific",
    "northwestern mutual", "state farm", "allstate", "geico", "progressive",
    "cvs", "walgreens", "rite aid", "family dollar", "dollar tree", "dollar general",
    "fedex", "ups store", "u-haul", "pest control pro", "terminix", "truly nolen",
    "lawn doctor", "weedeater", "mister sparky", "one hour", "mr. electric",
    "rooter", "rooter", "r.n. plumbing", "arnold's plumbing",
    "jiffy", "moneygram", "western union", "at&t", "verizon", "t-mobile",
    "century link", "sprint", "comcast", "xfinity", "cox communications",
    "cricket wireless", "metro pcs", "simple mobile",
    "planet fitness", "la fitness", "24 hour fitness", "anytime fitness",
    "orangetheory", "crunch fitness", "equinox", "lifetime fitness",
    "f45", "crossfit", "orangetheory fitness",
    "bay auto", "express oil change", "take 5 oil change", "fastcast oil change",
    "northside collision", "carsmith", "dent doctor", "auto advantage",
    "(former)", "speedpark", "speedway", "mcdonald's", "coca-cola",
    "marijuana dispensary", "dispensary",
}

# Stack markers used to date a site.
LEGACY_STACK_MARKERS = (
    "jquery-1.", "jquery.min.js", "prototype.js", "mootools",
    "bootstrap.min.css", "html5shiv", "respond.min.js",
    "wp-includes/js/jquery", "tinymce", "ckeditor",
)

MODERN_STACK_MARKERS = (
    "__next_data__", "gatsby", "nuxt", "svelte", "astro-island",
    "webflow", "wix-", "shopify", "squarespace", "wp-json",
    "elementor", "divi", "tailwind", "alpine.js",
)


@dataclass
class ScraperConfig:
    """Runtime knobs."""

    google_api_key: str = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
    # Must NOT look like a browser. Overpass sits behind mod_security that
    # returns 406 to Chrome/Safari-style User-Agent strings; an honest,
    # contactable scraper UA works reliably. Keep it that way.
    user_agent: str = os.environ.get(
        "SCRAPER_USER_AGENT",
        "local-outreach-scraper/1.0 (+local business lead research)",
    )
    contact_email: str = os.environ.get("OUTREACH_EMAIL", "").strip()

    request_timeout: int = int(os.environ.get("SCRAPER_TIMEOUT", "20"))
    audit_timeout: int = int(os.environ.get("AUDIT_TIMEOUT", "12"))
    max_retries: int = int(os.environ.get("SCRAPER_RETRIES", "4"))
    cache_ttl_hours: int = int(os.environ.get("SCRAPER_CACHE_TTL_HOURS", "24"))
    use_cache: bool = os.environ.get("SCRAPER_USE_CACHE", "1") != "0"

    # Overpass mirrors, tried in order.
    overpass_endpoints: list[str] = field(
        default_factory=lambda: [
            e.strip()
            for e in os.environ.get(
                "OVERPASS_ENDPOINTS",
                "https://overpass-api.de/api/interpreter,"
                "https://overpass.kumi.systems/api/interpreter,"
                "https://overpass.private.coffee/api/interpreter",
            ).split(",")
            if e.strip()
        ]
    )

    # Places API caps a text-search page at 60 results / 3 pages.
    places_max_pages: int = int(os.environ.get("PLACES_MAX_PAGES", "3"))
    # Hard ceiling so a misconfigured run cannot burn a month of quota.
    max_queries: int = int(os.environ.get("MAX_QUERIES", "0"))  # 0 = unlimited
    audit_enabled: bool = os.environ.get("AUDIT_ENABLED", "1") != "0"
    audit_concurrency: int = int(os.environ.get("AUDIT_CONCURRENCY", "6"))
    verbose: bool = os.environ.get("SCRAPER_VERBOSE", "0") == "1"

    def ensure_dirs(self) -> None:
        DATA_DIR.mkdir(exist_ok=True)
        CACHE_DIR.mkdir(exist_ok=True)

    def has_google(self) -> bool:
        return bool(self.google_api_key)


CONFIG = ScraperConfig()
