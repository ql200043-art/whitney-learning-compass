"""Offline UI fixtures: real catalog/matcher, saved Stage 4 teaching suggestions.

Run from the project root with .venv/bin/python frontend/scripts/stage4-1-fixtures.py.
Candidate selection is a deliberate UI test arrangement, NOT an agent ranking.
No providers, agents, or network calls are invoked.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from matching import load_catalog, match_catalog
from backend.models import TeacherRequest
from backend.validation import facts

catalog = load_catalog()
history = json.loads((ROOT / "artifacts/stage4/browser-live.json").read_text())
teacher = next(r["request"] for r in history["records"] if r["route"] == "/api/recommend")
selected_ids = ["ewm-catapult", "ewm-rubber-band-car", "ewm-bridges"]
cases = {}
for name, changes in {
    "provided": {"max_program_fee": 400, "budget_currency": "USD", "assume_usd": True, "max_duration_minutes": 90},
    "blank": {"max_program_fee": None, "budget_currency": None, "assume_usd": False, "max_duration_minutes": None},
    "edited": {"max_program_fee": 600, "budget_currency": "USD", "assume_usd": True, "max_duration_minutes": 120},
}.items():
    request = TeacherRequest.model_validate({**teacher, **changes})
    matches = match_catalog(catalog, request.matching_input())
    by_id = {m["program_id"]: m for m in matches}
    candidates = []
    for pid in selected_ids:
        program = next(p for p in catalog["programs"] if p["id"] == pid)
        m = by_id[pid]
        if m["eligibility_status"] == "fail":
            continue
        candidates.append({"program_id": pid, "category": "eligible" if m["eligibility_status"] == "pass" else "provisional",
            "ai_educational_reasoning": "Offline interface test option. Review the published activity and your teaching goal; this is not a new AI recommendation.",
            "museum_facts": facts(program).model_dump(), "eligibility": m,
            "evidence": [{"program_id": pid, "field": "/description", "source_id": "program_page"}]})
    response = {"workflow_id": "00000000-0000-4000-8000-000000000041", "workflow_token": "offline-test-capability-only",
        "run_id": "00000000-0000-4000-8000-000000000042", "interpreted_goal": request.learning_goal,
        "recommendations": [c for c in candidates if c["category"] == "eligible"],
        "provisional_options": [c for c in candidates if c["category"] == "provisional"],
        "eligibility_results": matches, "message": "Offline UI fixture", "booking_confirmed": False, "requires_teacher_selection": True}
    cases[name] = {"request": request.model_dump(), "response": response}
assert cases["provided"]["response"]["recommendations"][0]["eligibility"]["program_fee"]["subtotal"] == "336.00"
for name in ("provided", "edited"):
    assert {c["program_id"] for c in cases[name]["response"]["provisional_options"]} == {"ewm-bridges", "ewm-rubber-band-car"}
assert len(cases["blank"]["response"]["recommendations"]) == 3
journey = next(r["response"] for r in history["records"] if r["route"] == "/api/journey")
journey = {**journey, "workflow_id": cases["provided"]["response"]["workflow_id"], "run_id": "00000000-0000-4000-8000-000000000043"}
out = ROOT / "artifacts/stage4_1"
out.mkdir(exist_ok=True)
(out / "offline-fixtures.json").write_text(json.dumps({"execution_kind": "offline fixtures; actual deterministic matching, replayed historical teaching suggestions; no inference", "cases": cases, "journey": journey}, indent=2)+"\n")
print("Generated three validated request cases; 20 actual matcher results each; Catapult $336; Bridges and Rubber Band Car unknown with time limit, pass without.")
