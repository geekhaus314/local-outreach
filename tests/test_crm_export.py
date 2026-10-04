import csv
import json

import pytest

import export_to_crm
from export_to_crm import payload_for


FIELDS = [
    "Business Name", "Industry", "Website", "Phone", "Address", "Classification",
    "Opportunity Score", "Need Score", "Value Score", "Site Health", "Rating",
    "Review Count", "Audit Summary", "Pitch Facts", "Sources", "Low Confidence",
    "Last Audited",
]


def write_csv(path):
    rows = [
        {
            "Business Name": f"Lead {index}",
            "Industry": "Plumbing",
            "Website": f"https://lead-{index}.example",
            "Phone": f"314-555-000{index}",
            "Address": f"{index} Main St",
            "Classification": "NEEDS_REHAB",
            "Opportunity Score": "80",
            "Need Score": "85",
            "Value Score": "72",
            "Site Health": "20",
            "Rating": "4.8",
            "Review Count": "120",
            "Audit Summary": "Missing viewport",
            "Pitch Facts": "No viewport tag",
            "Sources": "google_places",
            "Low Confidence": "no",
            "Last Audited": "2026-10-02",
        }
        for index in (1, 2)
    ]
    with path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def test_payload_contains_only_the_selected_lead_evidence():
    payload = payload_for({
        "Business Name": "Example Plumbing",
        "Industry": "Plumbing",
        "Website": "https://example.com",
        "Phone": "314-555-0100",
        "Address": "1 Main St",
        "Classification": "NEEDS_REHAB",
        "Opportunity Score": "87",
        "Need Score": "92",
        "Value Score": "79",
        "Site Health": "22",
        "Rating": "4.8",
        "Review Count": "120",
        "Audit Summary": "Missing viewport",
        "Pitch Facts": "No viewport tag | No booking path",
        "Sources": "google_places,overpass",
        "Low Confidence": "no",
        "Last Audited": "2026-10-02",
        "Persona Read": "internal-only notes must not be exported",
    })

    assert payload["schema_version"] == 1
    assert payload["pitch_facts"] == ["No viewport tag", "No booking path"]
    assert payload["sources"] == ["google_places", "overpass"]
    assert payload["low_confidence"] is False
    assert "Persona Read" not in payload
    assert "draft" not in payload


def test_payload_preserves_unknown_scores_and_marks_low_confidence():
    payload = payload_for({
        "Business Name": "No Website Plumbing",
        "Industry": "Plumbing",
        "Website": "",
        "Phone": "",
        "Address": "2 Main St",
        "Classification": "NO_PRESENCE",
        "Opportunity Score": "75",
        "Need Score": "100",
        "Value Score": "34",
        "Site Health": "",
        "Rating": "",
        "Review Count": "",
        "Audit Summary": "no website to audit",
        "Pitch Facts": "No website found",
        "Sources": "overpass",
        "Low Confidence": "yes",
        "Last Audited": "",
    })

    assert payload["website"] == ""
    assert payload["site_health"] is None
    assert payload["rating"] is None
    assert payload["review_count"] is None
    assert payload["last_audited"] is None
    assert payload["low_confidence"] is True


def test_payload_refuses_google_maps_scraped_records():
    with pytest.raises(ValueError, match="Google Maps-scraped"):
        payload_for({
            "Business Name": "Example Plumbing",
            "Industry": "Plumbing",
            "Website": "https://example.com",
            "Phone": "",
            "Address": "",
            "Classification": "NEEDS_REHAB",
            "Opportunity Score": "75",
            "Need Score": "80",
            "Value Score": "67",
            "Site Health": "20",
            "Rating": "4.5",
            "Review Count": "50",
            "Audit Summary": "Missing mobile viewport",
            "Pitch Facts": "No viewport tag",
            "Sources": "gmaps",
            "Low Confidence": "no",
            "Last Audited": "2026-10-01",
        })


def test_cli_sends_only_the_explicitly_selected_row(tmp_path, monkeypatch, capsys):
    path = tmp_path / "leads.csv"
    write_csv(path)
    monkeypatch.setenv("PWN4G3_ADMIN_TOKEN", "test-token")
    sent = []

    class Response:
        status = 201

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self, _size):
            return b'{"ok":true}'

    def fake_urlopen(request, timeout):
        sent.append((request, timeout))
        return Response()

    monkeypatch.setattr(export_to_crm, "urlopen", fake_urlopen)
    assert export_to_crm.main(["--csv", str(path), "--index", "2", "--yes"]) == 0

    request, timeout = sent[0]
    payload = json.loads(request.data)
    assert timeout == 15
    assert request.full_url == export_to_crm.IMPORT_URL
    assert request.get_header("Authorization") == "Bearer test-token"
    assert payload["name"] == "Lead 2"
    assert payload["phone"] == "314-555-0002"
    assert "Lead 1" not in request.data.decode()
    assert "No outreach message is sent." in capsys.readouterr().out


def test_cli_requires_confirmation_when_non_interactive(tmp_path, monkeypatch):
    path = tmp_path / "leads.csv"
    write_csv(path)
    monkeypatch.setenv("PWN4G3_ADMIN_TOKEN", "test-token")
    calls = []
    monkeypatch.setattr(export_to_crm, "urlopen", lambda *_args, **_kwargs: calls.append(True))

    assert export_to_crm.main(["--csv", str(path), "--index", "1"]) == 1
    assert calls == []
