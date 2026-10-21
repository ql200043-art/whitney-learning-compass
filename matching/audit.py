"""Reproducible local catalog audit, coverage generation and real matching examples."""
import hashlib
import json
from collections import Counter
from pathlib import Path
from .catalog import load_catalog
from .coverage import load_themes, build_coverage, render_coverage
from .engine import match_program

ROOT = Path(__file__).resolve().parents[1]

def fingerprint(program):
    return hashlib.sha256(json.dumps(program, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def run_audit():
    catalog = load_catalog()
    themes = load_themes()
    coverage = build_coverage(catalog, themes)
    programs = {p["id"]: p for p in catalog["programs"]}
    baseline = json.loads((ROOT / "tests/fixtures/pilot_sha256.json").read_text())
    preserved = {pid: fingerprint(programs[pid]) == value for pid, value in baseline.items()}
    if not all(preserved.values()):
        raise ValueError("Pilot preservation check failed")
    unknowns = Counter(u["field"] for p in programs.values() for u in p["unknown_fields"])
    requirements = {"grades": [4], "student_count": 24, "max_program_fee": 400,
                    "budget_currency": "USD", "assume_usd": True, "max_duration_minutes": 90}
    cases = [
        ("catapult_pass", "ewm-catapult", requirements),
        ("wind_budget_fail", "ewm-sustainable-energy-wind-power", {**requirements, "max_program_fee": 350}),
        ("bridges_duration_unknown", "ewm-bridges", requirements),
        ("catapult_capacity_unknown", "ewm-catapult", {**requirements, "mandatory_operational": {"capacity": True}}),
        ("bridges_grade_failure_precedes_unknown", "ewm-bridges", {**requirements, "grades": [2]}),
    ]
    demonstrations = [{"case": name, "requirements": req, "result": match_program(programs[pid], req)}
                      for name, pid, req in cases]
    audit = {"stage": 2, "catalog_programs": len(programs), "new_programs": len(programs) - len(baseline),
             "source_review_date": catalog["curated_on"],
             "source_urls": [p["official_url"] for p in programs.values()],
             "integrity": "passed", "pilot_preservation": preserved,
             "unknown_field_counts": dict(sorted(unknowns.items())),
             "field_evidence_entries": sum(len(p["field_evidence"]) for p in programs.values()),
             "uncertain_theme_assignments": len(coverage["uncertain_assignments"]),
             "catalog_sha256": hashlib.sha256((ROOT / "data/programs.json").read_bytes()).hexdigest(),
             "no_model_calls": True}
    out = ROOT / "artifacts"; out.mkdir(exist_ok=True)
    for path, obj in [(out / "catalog_audit.json", audit), (out / "matching_demonstrations.json", demonstrations),
                      (ROOT / "data/coverage.json", coverage)]:
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "docs/catalog_coverage.md").write_text(render_coverage(coverage, catalog, themes), encoding="utf-8")
    return audit

if __name__ == "__main__":
    print(json.dumps(run_audit(), indent=2))
