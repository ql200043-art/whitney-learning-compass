import copy
import hashlib
import json
from pathlib import Path
import pytest
from matching import CatalogError, load_catalog, validate_catalog
from matching.catalog import DEFAULT_CATALOG, null_pointers, resolve_pointer

def test_real_catalog_loads(catalog):
    assert len(catalog["programs"]) == 20
    assert catalog["schema_version"] == "1.0.0"

def test_ids_urls_sources_and_unknowns(catalog):
    programs = catalog["programs"]
    assert len({p["id"] for p in programs}) == len(programs)
    assert len({p["official_url"] for p in programs}) == len(programs)
    for p in programs:
        ids = {s["source_id"] for s in p["sources"]}
        assert {u["field"] for u in p["unknown_fields"]} == null_pointers(p)
        for path, e in p["field_evidence"].items():
            resolve_pointer(p, path)
            assert e["source_id"] in ids
        assert p["price"]["currency_code"] is None
        assert "editorial_themes" not in p

def test_pilots_preserved(catalog):
    frozen = json.loads((Path(__file__).parent / "fixtures/pilot_sha256.json").read_text())
    for p in catalog["programs"]:
        if p["id"] in frozen:
            actual = hashlib.sha256(json.dumps(p, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
            assert actual == frozen[p["id"]]
    assert len(frozen) == 5

@pytest.mark.parametrize("fault", [
    "duplicate_id", "duplicate_url", "missing_field", "bad_source", "bad_pointer",
    "missing_unknown", "false_unknown", "bad_grade", "bad_normalization", "negative_price",
    "boolean_price", "nan_price", "bad_minutes", "hours_mismatch", "price_mismatch",
    "unknown_evidence_source", "unverified_currency_invention", "invalid_date", "empty_subjects",
])
def test_rejects_catalog_corruption(catalog, fault):
    p = catalog["programs"][0]
    if fault == "duplicate_id": catalog["programs"][1]["id"] = p["id"]
    elif fault == "duplicate_url":
        catalog["programs"][1]["official_url"] = p["official_url"]
        catalog["programs"][1]["sources"][0]["url"] = p["official_url"]
    elif fault == "missing_field": del p["description"]
    elif fault == "bad_source": p["sources"][0]["url"] = "https://www.eliwhitney.org/wrong"
    elif fault == "bad_pointer": p["field_evidence"]["/does_not_exist"] = p["field_evidence"]["/description"]
    elif fault == "missing_unknown": p["unknown_fields"].pop()
    elif fault == "false_unknown": p["unknown_fields"][0]["field"] = "/official_name"
    elif fault == "bad_grade": p["grade_levels"] = ["8+"]
    elif fault == "bad_normalization": p["in_scope_grade_levels"] = [2, 3, 4, 5, 6]
    elif fault == "negative_price": p["price"]["amount"] = -1
    elif fault == "boolean_price": p["price"]["amount"] = True
    elif fault == "nan_price": p["price"]["amount"] = float("nan")
    elif fault == "bad_minutes": p["duration"]["minutes"] = 0
    elif fault == "hours_mismatch": p["duration"]["minutes"] = 150
    elif fault == "price_mismatch": p["price"]["listed_text"] = "$99.00 per student"
    elif fault == "unknown_evidence_source": p["field_evidence"]["/description"]["source_id"] = "absent"
    elif fault == "unverified_currency_invention": p["price"]["currency_code"] = "USD"
    elif fault == "invalid_date": p["sources"][0]["accessed_on"] = "2026-02-30"
    elif fault == "empty_subjects": p["subjects"] = []
    with pytest.raises(CatalogError):
        validate_catalog(catalog)

@pytest.mark.parametrize("text", ['{"a": 1, "a": 2}', '{"price": NaN}', '{invalid'])
def test_bad_json_rejected(tmp_path, text):
    f = tmp_path / "invalid.json"; f.write_text(text)
    with pytest.raises(CatalogError):
        load_catalog(f)

def test_pilot_source_findings(program):
    assert program("bridges")["duration"]["minutes"] is None
    tangrams = program("tangrams")
    assert tangrams["grade_levels"] == ["K", "1", "2", "3", "4", "5", "6", "7+"]
    assert any("ending at 6" in n for n in tangrams["verification"]["notes"])
    assert program("sustainable-energy-wind-power")["price"]["amount"] == 15
    assert program("simple-machines")["in_scope_grade_levels"] == [2, 3, 4, 5]
