"""Tests for contact-address discovery.

The whole point of this module is that a wrong address is worse than no
address: it bounces, it costs the sending reputation of the domain, and it is
how a lead list stops being trustworthy. So these lean hard on the junk filter
and on the ranking, and less on the happy path.

    python3 -m pytest tests/test_contact.py -q
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scraper.contact import best, extract


@pytest.mark.parametrize(
    "html,expected",
    [
        # The obvious ones.
        ('<a href="mailto:Info@FlowKingRooter.com">Email</a>', "info@flowkingrooter.com"),
        ("Call us, or write to sales@apexhvac.net today", "sales@apexhvac.net"),
        # Obfuscated but still published.
        ("info [at] flowkingrooter [dot] com", "info@flowkingrooter.com"),
        ("info@ flowkingrooter.com", "info@flowkingrooter.com"),
        ("info(at)flowkingrooter.com", "info@flowkingrooter.com"),
    ],
)
def test_finds_published_addresses(html, expected):
    assert best(extract(html=html, site_domain="flowkingrooter.com")) == expected


@pytest.mark.parametrize(
    "html",
    [
        # Vendors and platforms, not the business.
        '<img src="logo.png" alt="x">',
        "sentry DSN sent to 4a1b2c@sentry.io",
        "Built by Wix — questions? support@wixpress.com",
        "Domain for sale: buyer@yourdomain.com",
        # Placeholders.
        "you@example.com",
        "john.doe@company.com",
        "test@test.com",
        # Asset paths that look like addresses in srcset attributes.
        'srcset="hero@2x.png 2x, hero@3x.png 3x"',
        "background: url(bg@2x.png)",
        # Automated mailboxes: right address, wrong recipient.
        "no-reply@site.com sent your receipt",
        "do-not-reply@site.com",
        "noreply@site.com",
    ],
)
def test_junk_is_dropped_not_ranked_down(html):
    assert best(extract(html=html, site_domain="site.com")) == ""


def test_asset_suffix_in_local_part_is_junk():
    assert best(extract(html="<a href='mailto:logo.svg'>x</a>", site_domain="site.com")) == ""


def test_on_site_domain_beats_free_mailbox():
    """A business mailbox is stronger evidence than a gmail address."""
    html = (
        '<a href="mailto:bob@gmail.com">Bob</a> '
        '<a href="mailto:info@flowkingrooter.com">Info</a>'
    )
    assert best(extract(html=html, site_domain="flowkingrooter.com")) == "info@flowkingrooter.com"


def test_free_mailbox_still_counts_when_it_is_all_there_is():
    """Two-person shops often have nothing but a gmail. That is still a mailbox."""
    html = '<a href="mailto:mary@gmail.com">Mary</a>'
    assert best(extract(html=html, site_domain="smallshop.com")) == "mary@gmail.com"


def test_role_address_outranks_obscure_local_part():
    html = "reach us: contact@flowkingrooter.com or xz7q2@flowkingrooter.com"
    assert best(extract(html=html, site_domain="flowkingrooter.com")) == "contact@flowkingrooter.com"


def test_mailto_beats_bare_text_at_same_domain():
    html = "questions? owner@site.com &nbsp; <a href='mailto:info@site.com'>info</a>"
    assert best(extract(html=html, site_domain="site.com")) == "info@site.com"


def test_subdomain_collapse_treated_as_on_site():
    html = '<a href="mailto:info@mail.flowkingrooter.com">x</a>'
    got = extract(html=html, site_domain="flowkingrooter.com")
    assert got and got[0].on_site_domain


def test_query_string_stripped_from_mailto():
    html = '<a href="mailto:info@site.com?subject=Hi%20there">mail</a>'
    assert best(extract(html=html, site_domain="site.com")) == "info@site.com"


def test_mailto_encoded_address_decoded():
    html = '<a href="mailto:info%2Bjobs@site.com">jobs</a>'
    assert best(extract(html=html, site_domain="site.com")) == "info+jobs@site.com"


def test_case_is_normalised_so_dupes_collapse():
    html = '<a href="mailto:Info@Site.com">a</a><a href="mailto:info@site.com">b</a>'
    got = extract(html=html, site_domain="site.com")
    assert len(got) == 1


def test_ranked_list_dedupes_and_orders():
    html = (
        '<a href="mailto:info@site.com">info</a>'
        '<a href="mailto:bob@gmail.com">bob</a>'
        "hello@site.com"
    )
    got = [c.address for c in extract(html=html, site_domain="site.com")]
    assert got == ["info@site.com", "hello@site.com", "bob@gmail.com"]


def test_empty_page_yields_nothing():
    assert extract(html="", text="") == []
    assert best(extract(html="<html><body>No contact details here.</body></html>")) == ""


def test_plain_text_without_markup_still_yields():
    assert best(extract(text="Email us at info@site.com or call 314-555-0100")) == "info@site.com"
