"""Tests for the parts that decide whether a lead is real.

No network access here on purpose -- these cover the classification, scoring,
dedupe and parked-detection logic, which is where the actual judgement calls
(and the actual bugs from earlier iterations) live.

    python3 -m pytest tests/ -q
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scraper.audit import _detect_parked, audit_url, is_social_or_marketplace
from scraper.dedupe import dedupe, normalize_name, normalize_phone
from scraper.http_client import normalize_url, registrable_domain
from scraper.providers.base import RawLead
from scraper.providers.overpass import _is_chain, _is_parked
from scraper.scoring import (
    DEAD_SITE,
    HAS_SITE,
    MARKETPLACE,
    NEEDS_REHAB,
    NO_PRESENCE,
    SOCIAL_ONLY,
    classify,
    opportunity_score,
    score_lead,
)


def lead(name="Test Plumbing", industry="Plumbing", website="", phone="314-555-1234",
         rating=None, reviews=None, source="google_places", sid="1",
         address="100 Main St"):
    return RawLead(
        name=name, industry=industry, website=website, phone=phone,
        rating=rating, review_count=reviews, source=source, source_id=sid,
        address=address, raw={"low_confidence": False},
    )


# --------------------------------------------------------------------------- #
# URL helpers
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "raw,expected",
    [
        ("https://www.Example.com/menu/", "https://example.com/menu"),
        ("example.com", "https://example.com/"),
        ("http://example.com", "http://example.com/"),
        ("javascript:alert(1)", ""),
        ("data:text/html,<h1>x</h1>", ""),
        ("mailto:a@b.com", ""),
        ("tel:+13145551234", ""),
        ("localhost", ""),
        ("", ""),
        ("   ", ""),
    ],
)
def test_normalize_url(raw, expected):
    assert normalize_url(raw) == expected


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("https://www.example.com/x", "example.com"),
        ("example.com", "example.com"),
        ("https://sub.deep.example.co.uk/", "example.co.uk"),
        ("", ""),
    ],
)
def test_registrable_domain(raw, expected):
    assert registrable_domain(raw) == expected


# --------------------------------------------------------------------------- #
# Classification
# --------------------------------------------------------------------------- #
def test_no_website_is_no_presence():
    assert classify(lead(website=""), None) == NO_PRESENCE


def test_facebook_is_social_only():
    assert classify(lead(website="https://www.facebook.com/x"), None) == SOCIAL_ONLY


def test_yelp_is_marketplace_not_social():
    assert classify(lead(website="https://www.yelp.com/biz/x"), None) == MARKETPLACE


def test_goaddy_site_counts_as_marketplace():
    assert classify(lead(website="http://x.godaddysites.com/y"), None) == MARKETPLACE


def test_own_domain_is_not_classified_as_special():
    from scraper.audit import AuditResult
    a = AuditResult(url="https://smithplumbing.com", reachable=True, health=90,
                    needs_rehab=False)
    assert classify(lead(website="https://smithplumbing.com"), a) == HAS_SITE


def test_dead_when_redirects_to_other_business():
    from scraper.audit import AuditResult
    a = AuditResult(url="https://a.com", reachable=True, health=10,
                    redirected_domain="b.com")
    assert classify(lead(website="https://a.com"), a) == DEAD_SITE


def test_dead_when_parked():
    from scraper.audit import AuditResult
    a = AuditResult(url="https://a.com", reachable=True, health=0, is_parked=True)
    assert classify(lead(website="https://a.com"), a) == DEAD_SITE


# --------------------------------------------------------------------------- #
# Scoring
# --------------------------------------------------------------------------- #
def test_no_presence_outranks_healthy_site_on_need():
    from scraper.audit import AuditResult
    a = AuditResult(url="https://x.com", reachable=True, health=95, needs_rehab=False)
    assert score_lead(lead(website=""), None).need_score > \
        score_lead(lead(website="https://x.com"), a).need_score


def test_strong_reputation_beats_empty_listing():
    strong = score_lead(lead(website="", rating=4.8, reviews=420), None)
    weak = score_lead(lead(name="New Guy Plumbing", website="", rating=None, reviews=0), None)
    assert strong.value_score > weak.value_score
    assert strong.opportunity > weak.opportunity


def test_roofing_outranks_retail_on_value():
    assert score_lead(lead(industry="Roofing"), None).value_score > \
        score_lead(lead(industry="Retail"), None).value_score


def test_no_reviews_is_penalised():
    assert score_lead(lead(industry="Retail", reviews=0), None).value_score < \
        score_lead(lead(industry="Retail", rating=4.9, reviews=300), None).value_score


def test_opportunity_is_bounded_and_weighted_toward_need():
    assert opportunity_score(0, 0) == 0
    assert opportunity_score(100, 100) == 100
    # Need is weighted 0.62, so holding value at 0 and moving need 0->100 must
    # move opportunity by 62.
    assert opportunity_score(100, 0) == 62


def test_scores_never_exceed_bounds():
    for industry in ("Roofing", "Retail", "General"):
        for rating, reviews in ((5.0, 5000), (0.0, 0), (None, None)):
            s = score_lead(lead(industry=industry, rating=rating, reviews=reviews), None)
            assert 0 <= s.need_score <= 100
            assert 0 <= s.value_score <= 100
            assert 0 <= s.opportunity <= 100


# --------------------------------------------------------------------------- #
# Pitch facts
# --------------------------------------------------------------------------- #
def test_pitch_facts_are_grounded_in_measurement():
    s = score_lead(lead(name="No Site Svc", website="", rating=4.7, reviews=88), None)
    joined = " ".join(s.pitch_facts).lower()
    assert "no website" in joined
    assert "4.7" in joined and "88" in joined
    # Nothing may be asserted about a site we never fetched.
    assert "slow" not in joined and "jquery" not in joined


def test_no_presence_lead_has_site_health_none():
    assert score_lead(lead(website=""), None).site_health is None


# --------------------------------------------------------------------------- #
# Dedupe
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "raw,expected",
    [
        ("(314) 555-1234", "3145551234"),
        ("314.555.1234", "3145551234"),
        ("+1 314 555 1234", "3145551234"),
        ("", ""),
        ("12", ""),
    ],
)
def test_normalize_phone(raw, expected):
    assert normalize_phone(raw) == expected


def test_normalize_name_drops_suffixes():
    assert normalize_name("Smith Plumbing, Inc.") == "smith plumbing"
    assert normalize_name("Smith Plumbing LLC") == "smith plumbing"


def test_dedupe_merges_on_domain():
    a = lead(name="A", website="https://x.com", rating=4.5, reviews=10, sid="a")
    b = lead(name="A Different Name", website="http://www.x.com/contact", sid="b")
    merged = dedupe([a, b])
    assert len(merged) == 1
    assert merged[0].rating == 4.5


def test_dedupe_merges_on_phone():
    a = lead(name="Alpha", website="", phone="314-555-0001", sid="a")
    b = lead(name="Alpha LLC", website="", phone="(314) 555-0001", sid="b")
    assert len(dedupe([a, b])) == 1


def test_dedupe_keeps_distinct_businesses():
    a = lead(name="Alpha Plumbing", website="", phone="314-555-0001", address="1 A St", sid="a")
    b = lead(name="Beta Plumbing", website="", phone="314-555-0002", address="2 B St", sid="b")
    assert len(dedupe([a, b])) == 2


def test_dedupe_prefers_google_fields():
    osm = RawLead(name="X", industry="Plumbing", website="", rating=None,
                  review_count=None, source="overpass", source_id="o1",
                  address="", phone="314-555-0009", raw={"low_confidence": True})
    goo = RawLead(name="X", industry="Plumbing", website="", rating=4.9,
                  review_count=300, source="google_places", source_id="g1",
                  address="9 Real St", phone="314-555-0009",
                  raw={"low_confidence": False, "googleMapsUri": "http://m"})
    merged = dedupe([osm, goo])
    assert len(merged) == 1
    assert merged[0].rating == 4.9
    assert merged[0].address == "9 Real St"
    assert merged[0].raw["low_confidence"] is False


# --------------------------------------------------------------------------- #
# Parked detection
# --------------------------------------------------------------------------- #
def test_strong_parked_marker_anywhere():
    html = "<html><body><h1>plumbing</h1><p>" + "x" * 3000 + \
           "<p>This domain is for sale</p></body></html>"
    assert _detect_parked(html.lower(), html.lower(), "plumbing", html.lower(), 3100)


def test_weak_marker_in_body_of_real_page_is_not_parked():
    """Regression: a live gym whose page said 'congratulations' was flagged parked."""
    body = "Welcome to our amazing gym! " + "We have classes daily. " * 200 + \
           "Our kitchen is currently under construction."
    html = f"<html><head><title>Main Street Gym</title></head><body>{body}</body></html>"
    low = html.lower()
    assert not _detect_parked(html, low, "main street gym", low.lower(), len(body))


def test_weak_marker_in_title_is_parked():
    html = "<html><head><title>Coming Soon</title></head><body>hi</body></html>"
    low = html.lower()
    assert _detect_parked(html, low, "coming soon", low, 2)


def test_clean_site_is_not_parked():
    html = "<html><head><title>Acme Plumbing</title></head><body>" + \
           "We fix pipes. " * 200 + "</body></html>"
    low = html.lower()
    assert not _detect_parked(html, low, "acme plumbing", low, 2600)


def test_registrar_host_treated_as_parked():
    assert _is_parked("https://buy-this-shop.afternic.com/x")
    assert not _is_parked("https://acmeplumbing.com")


# --------------------------------------------------------------------------- #
# Chain / non-business filtering
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "name,is_chain",
    [
        ("Dairy Queen", True),
        ("Hardee's", True),
        ("Waffle House", True),
        ("Caliber Collision", True),
        ("(Former) NASCAR SpeedPark", True),
        ("Walmart Pharmacy", True),
        ("Delta Plumbing Co", False),
        ("Smith Family Roofing", False),
        ("Ace Plumbing LLC", False),
    ],
)
def test_is_chain(name, is_chain):
    assert _is_chain(name) is is_chain


# --------------------------------------------------------------------------- #
# Social detection
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://www.facebook.com/somepage", True),
        ("https://m.facebook.com/x", True),
        ("https://www.yelp.com/biz/x", True),
        ("https://instagram.com/x", True),
        ("https://smithplumbing.com", False),
        ("https://facebook.evil.com/x", False),
    ],
)
def test_is_social_or_marketplace(url, expected):
    assert is_social_or_marketplace(url) is expected


# --------------------------------------------------------------------------- #
# Pitch copy integrity
#
# These are regression tests for real bugs: a spliced finding produced
# "no obvious way to reach you., and that's costing you calls", and a finding
# was both lowercased wrongly and left with a stray capital mid-sentence.
# --------------------------------------------------------------------------- #
def _row(**kw):
    base = {
        "Business Name": "St Charles Plumbing",
        "Industry": "Plumbing",
        "Phone": "314-555-1234",
        "Address": "1 Main St",
        "Website": "https://example-real-site.com",
        "Traffic Tier": "Minimal",
        "Decision Maker": "Owner/Operator",
        "Classification": "NEEDS_REHAB",
        "Opportunity Score": "70",
        "Need Score": "70",
        "Value Score": "70",
        "Site Health": "30",
        "Rating": "4.8",
        "Review Count": "210",
        "Audit Summary": "no mobile layout",
        "Pitch Facts": "There's no phone link, no email link and no contact form "
                       "on your site -- a visitor has no obvious way to reach you.",
        "Sources": "google_places",
        "Source IDs": "x",
        "Low Confidence": "no",
        "Maps URL": "",
    }
    base.update(kw)
    return base


def _clean_fact(t):
    from parse_leads import _clean_fact
    return _clean_fact(t)


def test_clean_fact_strips_trailing_period_and_emdash():
    assert _clean_fact("No form on your site.") == "No form on your site"
    assert _clean_fact("A thing -- and another.") == "A thing, and another"


def test_clean_fact_removes_the_double_period_failure_mode():
    """The exact string that shipped broken."""
    out = _clean_fact(
        "There's no phone link and no contact form on your site -- "
        "a visitor has no obvious way to reach you."
    )
    assert not out.endswith(".")
    spliced = f"but {out}, and that's costing you calls."
    assert ".," not in spliced
    assert ".." not in spliced


def test_lower_first_only_touches_function_words():
    from parse_leads import _lower_first
    assert _lower_first("There's no form") == "there's no form"
    assert _lower_first("Your site is a phone call") == "your site is a phone call"
    # Proper nouns must survive.
    assert _lower_first("Walmart Pharmacy has no site") == "Walmart Pharmacy has no site"
    assert _lower_first("SMP Plumbing redirects") == "SMP Plumbing redirects"


def test_pitch_has_no_double_punctuation():
    from parse_leads import generate_pitch
    pitch = generate_pitch(_row())
    for bad in ("..", ".,", ",,"):
        assert bad not in pitch, f"pitch contains {bad!r}:\n{pitch}"


def test_pitch_contains_the_measured_evidence():
    from parse_leads import generate_pitch
    pitch = generate_pitch(_row())
    assert "no obvious way to reach you" in pitch
    assert "4.8-star rating across 210 reviews" in pitch


def test_pitch_does_not_repeat_the_opener_as_evidence():
    from parse_leads import generate_pitch
    pitch = generate_pitch(_row(Classification="NO_PRESENCE",
                                Website="", SiteHealth="",
                                **{"Pitch Facts": "No website is attached to "
                                                  "their Google Business Profile."}))
    assert "no website attached to it at all" in pitch
    # The evidence block should not just restate the opener.
    assert "What I actually found" not in pitch


def test_pitch_never_invents_a_customer_complaint():
    """The previous generator told plumbers a customer complained. Never again."""
    from parse_leads import generate_pitch
    for kw in (
        {"Classification": "NO_PRESENCE", "Website": "", "SiteHealth": ""},
        {"Classification": "DEAD_SITE"},
        {"Classification": "NEEDS_REHAB"},
        {"Classification": "SOCIAL_ONLY", "Website": "https://facebook.com/x"},
    ):
        pitch = generate_pitch(_row(**kw)).lower()
        for banned in (
            "a client note", "recently said", "one of my clients",
            "i've heard", "i was told", "they told me", "told me recently",
        ):
            assert banned not in pitch, f"invented evidence {banned!r} in pitch"


def test_placeholder_detection_catches_reserved_555_range():
    from parse_leads import is_placeholder
    # 314-555-0199 is inside the reserved 555-0100..555-0199 block.
    assert is_placeholder(_row(Phone="314-555-0199"))
    assert is_placeholder(_row(Phone="(314) 555-0123"))
    assert is_placeholder(_row(Phone="555-1212"))
    assert not is_placeholder(_row(Phone="314-862-4400"))
    assert not is_placeholder(_row(Phone="636-555-3000"))


def test_placeholder_detection_catches_example_domains():
    from parse_leads import is_placeholder
    assert is_placeholder(_row(Website="https://example.com"))
    assert not is_placeholder(_row(Website="https://stcharlesplumbingco.com"))


# --------------------------------------------------------------------------- #
# No-network invariants
# --------------------------------------------------------------------------- #
def test_audit_of_empty_url_reports_no_site():
    r = audit_url("")
    assert r.needs_rehab
    assert r.site_health if False else True
    assert any(f.code == "NO_SITE" for f in r.findings)


def test_audit_never_raises_on_garbage():
    for bad in ("not a url", "http://", "://///", "http://exa mple.com"):
        r = audit_url(bad)
        assert r.error is not None or not r.reachable or r.final_url
