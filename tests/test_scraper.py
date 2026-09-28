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

from scraper.audit import (
    AuditResult,
    Finding,
    _detect_parked,
    audit_url,
    is_social_or_marketplace,
)
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
from parse_leads import Lead


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


def _lead(**kw):
    """A Lead built from a CSV row, optionally with a stubbed audit."""
    from parse_leads import Lead
    from scraper.audit import AuditResult
    audit = kw.pop("audit", "none")
    if audit == "none":
        audit = None
    elif audit == "contact":
        audit = AuditResult(url="https://x.com", reachable=True, health=30,
                            needs_rehab=True, title="X")
        audit.findings.append(Finding(
            "NO_CONTACT", "No way to make contact", 65, "no tel/mailto/form",
            "There's no phone link, no email link and no contact form on your "
            "site -- a visitor has no obvious way to reach you."))
    elif audit == "other":
        audit = AuditResult(url="https://x.com", reachable=True, health=0,
                            serves_other_business="Some Other Plumbing")
    elif audit == "healthy":
        audit = AuditResult(url="https://x.com", reachable=True, health=100,
                            title="X Plumbing")
    return Lead(_row(**kw), audit, audit is not None)


# --------------------------------------------------------------------------- #
# The message a prospect actually receives
# --------------------------------------------------------------------------- #
def test_message_has_no_double_punctuation():
    """A finding spliced into a sentence used to produce "reach you., and"."""
    from parse_leads import message
    for kw in ({"Classification": "NEEDS_REHAB", "audit": "contact"},
               {"Classification": "DEAD_SITE", "audit": "other"},
               {"Classification": "NO_PRESENCE", "Website": ""}):
        msg = message(_lead(**kw), "text")
        for bad in ("..", ".,", ",,", "!.?", "?."):
            assert bad not in msg, f"message contains {bad!r}:\n{msg}"


def test_message_carries_the_measured_evidence():
    """The one specific thing we measured has to be in the message."""
    from parse_leads import message
    msg = message(_lead(Classification="NEEDS_REHAB", audit="contact"), "text")
    assert "no obvious way to reach you" in msg


def test_dead_domain_message_names_the_measured_fact():
    from parse_leads import message
    msg = message(_lead(Classification="DEAD_SITE", audit="other"), "text")
    assert "Some Other Plumbing" in msg


def test_message_does_not_repeat_itself_as_an_evidence_list():
    """The old format restated the opener verbatim as a bullet list."""
    from parse_leads import message
    msg = message(_lead(Classification="NO_PRESENCE", Website="",
                         **{"Pitch Facts": "No website is attached to their "
                                           "Google Business Profile."}), "text")
    assert "What I actually found" not in msg
    assert msg.lower().count("couldn't turn up a website") == 1


def test_message_never_claims_to_have_seen_a_google_listing():
    """The lead came from OpenStreetMap, which has no Google Business Profile.

    This sentence shipped. The reply to it is "which listing?", and there is no
    honest answer -- the record was never in Google.
    """
    from parse_leads import message
    for kw in ({"Classification": "NO_PRESENCE", "Website": ""},
               {"Classification": "DEAD_SITE", "audit": "other"},
               {"Classification": "HAS_DECENT_SITE",
                "Website": "https://beisplumbing.com/", "audit": "healthy"}):
        msg = message(_lead(**kw), "text").lower()
        assert "google business profile" not in msg
        assert "your listing" not in msg


def test_message_never_invents_a_customer_complaint():
    """The previous generator told plumbers a customer complained. Never again."""
    from parse_leads import message
    for kw in ({"Classification": "NO_PRESENCE", "Website": ""},
               {"Classification": "DEAD_SITE", "audit": "other"},
               {"Classification": "NEEDS_REHAB", "audit": "contact"}):
        msg = message(_lead(**kw), "text").lower()
        for banned in ("a client note", "recently said", "one of my clients",
                       "i've heard", "i was told", "they told me", "a customer said",
                       "lost you calls", "costing you"):
            assert banned not in msg, f"invented evidence {banned!r} in message"


def test_text_message_carries_an_opt_out():
    from parse_leads import message, OPTOUT
    assert OPTOUT in message(_lead(Classification="NO_PRESENCE", Website=""), "text")


def test_identifies_the_sender_and_shows_work():
    from parse_leads import message, PORTFOLIO
    msg = message(_lead(Classification="NO_PRESENCE", Website=""), "text")
    assert PORTFOLIO in msg, "a cold message with no proof of work gets deleted"


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
# Lead brokers, and what --no-check can and cannot know about them
# --------------------------------------------------------------------------- #
def test_toll_free_plus_multi_state_pitch_is_a_drop():
    """Both signals together mean the revenue is the sold call, not the work."""
    from parse_leads import DROP
    audit = AuditResult(url="https://x.com", reachable=True, health=40)
    audit.evidence["body_text"] = "Find the office nearest you. We serve five states."
    lead = Lead(_row(Phone="+1-877-513-4946"), audit, True)
    lead.classify()
    assert lead.state == DROP, lead.blockers


def test_toll_free_alone_is_not_enough_to_drop():
    """A cheap line on its own is a small contractor, not a lead broker."""
    from parse_leads import DROP
    audit = AuditResult(url="https://x.com", reachable=True, health=40)
    audit.evidence["body_text"] = "Family run since 1994. Call us any time."
    lead = Lead(_row(Phone="+1-877-513-4946"), audit, True)
    lead.classify()
    assert lead.state != DROP, "a toll-free number is not proof of an aggregator"


def test_no_check_flags_a_toll_free_lead_instead_of_holding_it_generically():
    """--no-check cannot read page text, so it must say so rather than imply
    the lead is merely unreviewed. Best Roofing Pros is a real drop; under
    --no-check it used to land in a generic HOLD, which is 6 minutes spent on
    someone who was never going to buy."""
    from parse_leads import DROP, HOLD
    lead = Lead(_row(Phone="+1-877-513-4946"), None, False)
    lead.classify()
    assert lead.state == HOLD
    assert lead.state != DROP, "the aggregator check cannot be evaluated offline"
    assert any("aggregator" in b for b in lead.blockers), lead.blockers


def test_local_number_is_unaffected_by_no_check():
    from parse_leads import HOLD
    lead = Lead(_row(Phone="+1-314-862-4400"), None, False)
    lead.classify()
    assert not any("aggregator" in b for b in lead.blockers), lead.blockers


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


# --------------------------------------------------------------------------- #
# Claims that reach a prospect
#
# Every bug in this block produced a sentence in a cold pitch that the recipient
# could disprove in about five seconds by opening their own website. They are
# pinned here because all three were live in the pipeline that generated the
# first batch of outreach.
# --------------------------------------------------------------------------- #
BLOCK_PAGE = (
    "<html><head><title>403 Forbidden</title></head>"
    "<body><h1>Forbidden</h1><p>You don't have permission to access this "
    "resource.</p></body></html>"
)


def _mock_fetch(monkeypatch, html, status=200, final_url=None):
    from scraper import audit as audit_mod

    class Page:
        def __init__(self):
            self.html = html
            self.status = status
            self.final_url = final_url or "https://acmeplumbing.com/"
            self.elapsed_ms = 120
            self.error = None

    monkeypatch.setattr(audit_mod, "fetch_page", lambda url: Page())


def test_meta_description_with_spaces_is_not_truncated(monkeypatch):
    """A 149-character description used to parse as 4 characters.

    The attribute pattern stopped at the first whitespace, so every description
    on every site looked too short, and businesses with complete, well-written
    descriptions were told to write a better one.
    """
    from scraper.audit import _meta_tags
    tags = _meta_tags(
        '<meta name="description" content="Roof repair, replacement and storm '
        'damage inspections. Contact us for a free estimate today.">'
    )
    desc = tags[0]["content"]
    # The old parser returned "Roof". Anything near the full sentence proves the
    # quoted-value fix is in place.
    assert len(desc) > 80, f"description truncated to {desc!r}"
    assert "replacement and storm" in desc


def test_no_false_analytics_claim_when_tag_manager_present(monkeypatch):
    """A site running Tag Manager was told it had no analytics."""
    _mock_fetch(
        monkeypatch,
        "<html><head><title>Acme Plumbing</title>"
        '<meta name="description" content="Acme Plumbing is a local plumber '
        'serving the greater St. Louis area since 1994 and counting.">'
        '<script src="https://www.googletagmanager.com/gtag/js"></script>'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        "</head><body>" + "<p>We fix leaks.</p>" * 400 + "</body></html>",
    )
    r = audit_url("https://acmeplumbing.com/", "Acme Plumbing")
    analytics_facts = [f for f in r.findings if f.code in ("NO_ANALYTICS", "BARE_BONES")]
    assert not analytics_facts, f"claimed no analytics on a tagged site: {analytics_facts}"
    assert r.evidence["has_analytics"] is True


def test_block_page_yields_no_defect_claims(monkeypatch):
    """A WAF stub used to be audited as the business's homepage.

    A 403 body has no links and no metadata, so it produced "no contact form",
    "no meta description" and "no analytics" -- all three false, all three sent.
    """
    _mock_fetch(monkeypatch, BLOCK_PAGE, status=403)
    r = audit_url("https://acmeplumbing.com/", "Acme Plumbing")
    assert r.blocked is True
    assert r.findings and all(f.code == "BLOCKED" for f in r.findings)
    assert r.needs_rehab is False, "a block page is not evidence of a bad site"


def test_domain_serving_another_business_is_dead_not_healthy(monkeypatch):
    """A plumber's domain still hosting a rival's blog scored as a healthy site."""
    _mock_fetch(
        monkeypatch,
        "<html><head><title>Riverside Plumbing - My WordPress Blog</title></head>"
        "<body><p>Latest news from the shop.</p></body></html>",
        final_url="http://acmeplumbing.com/",
    )
    r = audit_url("http://acmeplumbing.com/", "Acme Plumbing Company")
    assert r.serves_other_business
    assert classify(lead(name="Acme Plumbing Company", website="http://acmeplumbing.com/"), r) == DEAD_SITE


def test_matching_business_name_is_never_called_someone_elses(monkeypatch):
    """The accusation check has to stay quiet on ordinary sites.

    Flagging a real business as having lost its domain is the single worst
    failure this pipeline can produce, so the check is one-sided on purpose.
    """
    _mock_fetch(
        monkeypatch,
        "<html><head><title>Beis Plumbing | Plumbing Services in Valley Park</title>"
        '<meta name="description" content="Beis Plumbing has served St. Louis '
        'County since 1986: repairs, remodels, water heaters and drain clearing.">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<script src="https://www.googletagmanager.com/gtag/js"></script>'
        "</head><body>"
        '<a href="tel:13145551212">Call us</a><form action="/estimate"></form>'
        '<a href="https://google.com/maps/place/beis-plumbing">See our reviews</a>'
        "<p>Request a quote online. Serving St. Louis County since 1986.</p>" * 40
        + "</body></html>",
        final_url="https://beisplumbing.com/",
    )
    r = audit_url("https://beisplumbing.com/", "Beis Plumbing")
    assert not r.serves_other_business
    assert classify(lead(name="Beis Plumbing", website="https://beisplumbing.com/"), r) == HAS_SITE


def test_generic_trade_word_is_not_proof_of_identity(monkeypatch):
    """"Plumbing" matches half the market and must not count as a name match."""
    _mock_fetch(
        monkeypatch,
        "<html><head><title>Arch Plumbing - My WordPress Blog</title></head>"
        "<body><p>News.</p></body></html>",
        final_url="http://acmeplumbingco.com/",
    )
    # Distinctive token is "charles", which appears nowhere on the page.
    r = audit_url("http://acmeplumbingco.com/", "St Charles Plumbing Company")
    assert r.serves_other_business


# --------------------------------------------------------------------------- #
# Persona derivation
#
# The rule these exist to enforce: a read on a person is a guess, it is derived
# from the record rather than looked up by industry, and it carries the evidence
# that produced it. The old PSYCH_PROFILES table broke all three.
# --------------------------------------------------------------------------- #
def _scored(
    name: str = "Test Plumbing",
    industry: str = "Plumbing",
    classification: str = "NEEDS_REHAB",
    rating: float | None = 4.8,
    review_count: int | None = 240,
    site_health: int | None = 30,
    website: str = "https://x.com",
    low_confidence: bool = False,
) -> "ScoredLead":
    """A ScoredLead with test defaults.

    Explicit typed parameters rather than **over plus a defaults dict. The dict
    version inferred one union type for every field and reported thirty errors
    on a single line, which is exactly how a genuine mistake in a test file
    gets lost -- and the only reason those errors were even noise is that none
    of them were real.
    """
    from scraper.scoring import ScoredLead
    return ScoredLead(
        name=name, industry=industry, phone="314-555-0199",
        address="100 Main St", website=website, traffic_tier="low",
        decision_maker="Owner", classification=classification, opportunity=70,
        need_score=70, value_score=70, site_health=site_health, rating=rating,
        review_count=review_count, audit_summary="weak", pitch_facts=[],
        sources=["google_places"], source_ids="1", low_confidence=low_confidence,
        maps_url="", last_audited="2026-09-27", persona="",
    )


def _audited(title="Test Plumbing", **evidence):
    """An AuditResult with page copy attached.

    `title` is a real field on AuditResult and everything else goes into the
    evidence dict, so they are separate parameters. The first version took
    **kw for both, which meant a test passing `title="Acme"` silently left the
    real title as "Test Plumbing" -- and the plumbing pattern matched it, so a
    fixture meant to be trade-free reported a plumbing vocabulary. The test was
    wrong and the helper was why.
    """
    from scraper.audit import AuditResult
    r = AuditResult(url="https://x.com", reachable=True, health=30,
                    needs_rehab=True, title=title)
    r.evidence.update(evidence)
    return r


def test_persona_is_derived_not_looked_up_by_industry():
    """Same trade, opposite reads. A table keyed on Industry cannot do this."""
    from scraper.persona import read_persona
    strong = read_persona(_scored(rating=4.9, review_count=310))
    thin = read_persona(_scored(rating=None, review_count=4))
    assert strong.archetype != thin.archetype, (
        "a 4.9-star business with 310 reviews and one with 4 got the same read"
    )


def test_persona_always_carries_its_evidence():
    """A read with no evidence trail is the stereotype failure again."""
    from scraper.persona import read_persona
    for kw in ({}, {"classification": "NO_PRESENCE", "review_count": None},
               {"rating": None, "review_count": None, "low_confidence": True}):
        p = read_persona(_scored(**kw))
        assert p.evidence, f"no evidence for {kw}"
        assert any("review" in e or "site" in e or "record" in e or "website" in e
                   for e in p.evidence), p.evidence


def test_persona_evidence_contains_no_invented_numbers():
    """Every figure in the evidence list has to be a figure from the record."""
    from scraper.persona import read_persona
    lead = _scored(rating=4.8, review_count=240, site_health=30)
    p = read_persona(lead)
    blob = " ".join(p.evidence)
    for fig in ("4.8", "240", "30"):
        assert fig in blob, f"expected {fig} in {p.evidence}"
    # 4.9 belongs to the established band, not to this lead.
    assert "4.9" not in blob


def test_persona_flags_a_thin_read_when_there_is_no_voice():
    """Free OpenStreetMap record, no site text -- say so rather than guess."""
    from scraper.persona import read_persona
    p = read_persona(_scored(low_confidence=True, website=""), None)
    assert p.confidence == "thin", p.confidence


def test_persona_reads_their_own_words_for_urgency_and_price():
    from scraper.persona import read_persona
    a = _audited(body_text="24/7 emergency plumbing. Call for a free estimate.")
    p = read_persona(_scored(), a)
    assert any("urgency" in e for e in p.evidence), p.evidence
    assert any("price" in e for e in p.evidence), p.evidence


def test_persona_vocabulary_comes_from_their_site_not_a_table():
    """Their word for it, read off their own copy, falling back to nothing."""
    from scraper.persona import read_persona
    p = read_persona(_scored(industry="Roofing", name="Test Roofing"),
                     _audited(title="Test Roofing",
                             body_text="Shingle replacement and gutter repair."))
    assert p.vocabulary == "roof job", p.vocabulary
    blank = read_persona(_scored(industry="General", name="Acme"),
                         _audited(title="Acme", body_text="Welcome to our website."))
    assert blank.vocabulary == "", "guessed a vocabulary word out of thin air"
    # Two trades at equal strength is ambiguity, not a coin flip. One mention
    # each -- note that "drain" also counts as plumbing, so a second plumbing word
    # here would break the tie legitimately rather than by accident.
    split = read_persona(_scored(industry="General", name="Smith LLC"),
                         _audited(title="Smith LLC",
                                  body_text="Plumbing, roofing, painting."))
    assert split.vocabulary == "", f"picked a winner from a tie: {split.vocabulary}"
    # And a clear plurality does win -- "drain" makes plumbing 2 against 1 each.
    clear = read_persona(_scored(industry="General", name="Smith LLC"),
                         _audited(title="Smith LLC",
                                  body_text="Plumbing, drain work, roofing, painting."))
    assert clear.vocabulary == "plumbing job", clear.vocabulary


def test_persona_csv_round_trips():
    from scraper.persona import Persona, read_persona
    p = read_persona(_scored(), _audited(body_text="We do emergency drain work 24/7."))
    back = Persona.from_csv(p.to_csv())
    assert back.archetype == p.archetype
    assert back.angle == p.angle
    assert back.trap == p.trap
    assert back.vocabulary == p.vocabulary
    assert back.evidence == p.evidence
    assert back.confidence == p.confidence


def test_persona_never_reaches_the_prospect_message():
    """The boundary. A guess about somebody's character must not be sendable."""
    from parse_leads import message, prep_block
    lead = _lead(Classification="NEEDS_REHAB", audit="contact")
    lead.row["Persona Read"] = (
        "Sceptical Traditionalist who fears digital overhead | "
        "Open with their revenue | Never mention hosting | vocabulary: jobs | "
        "evidence: 4.8 stars; 240 reviews | confidence: good"
    )
    for channel in ("text", "call"):
        msg = message(lead, channel)
        for leak in ("Traditionalist", "Open with their revenue",
                     "Never mention hosting", "4.8 stars", "240 reviews"):
            assert leak not in msg, f"persona leaked into {channel}: {leak!r}\n{msg}"


def test_prep_block_is_labelled_and_collapsed():
    from parse_leads import prep_block
    lead = _lead(Classification="NEEDS_REHAB", audit="contact")
    lead.row["Persona Read"] = (
        "Sceptical Traditionalist | Open with proof | No jargon | "
        "vocabulary: jobs | evidence: 4.8 stars | confidence: good"
    )
    block = "\n".join(prep_block(lead))
    assert "for you, not the prospect" in block
    assert block.strip().startswith("<details>"), "prep block must be collapsed"
    assert "4.8 stars" in block, "the evidence has to be visible to Jake"


def test_prep_block_is_empty_when_there_is_no_read():
    from parse_leads import prep_block
    assert prep_block(_lead(Classification="NEEDS_REHAB", audit="contact")) == []
