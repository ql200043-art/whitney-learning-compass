import copy
import pytest
from matching import load_catalog

@pytest.fixture
def catalog():
    return load_catalog()

@pytest.fixture
def program(catalog):
    def get(slug):
        return copy.deepcopy(next(p for p in catalog["programs"] if p["id"] == "ewm-" + slug))
    return get

@pytest.fixture
def ordinary():
    return {"grades": [4], "student_count": 24, "max_program_fee": 400,
            "budget_currency": "USD", "assume_usd": True, "max_duration_minutes": 90}

def mark_unknown(p, path):
    """Deliberately altered test-only record; never added to the factual catalog."""
    keys = path.strip("/").split("/")
    node = p
    for key in keys[:-1]:
        node = node[key]
    node[keys[-1]] = None
    p["field_evidence"][path] = {"source_id": "program_page", "locator": "Synthetic test fixture",
                               "status": "unknown", "note": "Missing-value mutation for logic testing only."}
    if not any(u["field"] == path for u in p["unknown_fields"]):
        p["unknown_fields"].append({"field": path, "reason": "test_missing_value",
                                    "next_step": "Test-only mutation; never publish."})
