"""Offline only. Revalidate frozen real output and rerun the 24 technical scenarios.

Usage: python -m evaluation.revalidate_stage5b1 --output-dir .runtime/b1-rerun
The output directory must be new, inside this repository. Historical evidence is read only.
"""
import argparse
import asyncio
import hashlib
import json
from pathlib import Path

import pydantic_ai.models
from backend.models import AdvisorDraft, JourneyDraft, TeacherRequest
from backend.safety import OutputRejected
from backend.validation import validate_advisor, validate_journey
from matching import load_catalog, match_catalog
from evaluation import offline

ROOT = Path(__file__).resolve().parents[1]
HISTORY = ROOT / "artifacts/stage5"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def replay():
    catalog = load_catalog()
    programs = {p["id"]: p for p in catalog["programs"]}
    rows = []
    for role in ("advisor", "designer"):
        path = HISTORY / f"A01-full-{role}.json"
        trace = json.loads(path.read_text())
        request = TeacherRequest(**trace["teacher_request"])
        tools = [t["tool"] for t in trace["tools"]]
        try:
            if role == "advisor":
                matches = {m["program_id"]: m for m in match_catalog(catalog, request.matching_input())}
                validate_advisor(AdvisorDraft(**trace["output"]), programs, matches, tools)
            else:
                pid = trace["output"]["program_id"]
                selection = json.loads((HISTORY / "human_selection.json").read_text())
                assert selection["program_id"] == pid and selection["teacher_selected"] is True
                match = next(m for m in match_catalog(catalog, request.matching_input()) if m["program_id"] == pid)
                assert match["eligibility_status"] == "pass"
                validate_journey(JourneyDraft(**trace["output"]), programs[pid], tools)
            outcome, reason = "accepted", None
        except OutputRejected as exc:
            outcome, reason = "rejected", str(exc)
        expected = "rejected" if role == "advisor" else "accepted"
        rows.append(dict(role=role, source=str(path.relative_to(ROOT)), sha256=sha(path),
            historical_tool_names=tools, outcome=outcome, reason=reason, expected=expected,
            passed=outcome == expected))
    return dict(method="Offline revalidation of previously generated real-model output; recorded genuine tool context, recomputed matching and recorded selection. No new inference or authorization.",
        validator_sha256=sha(ROOT / "backend/validation.py"), live_calls=0, results=rows)


async def main(output):
    output = output.resolve()
    if not output.is_relative_to(ROOT) or output.exists():
        raise SystemExit("Use a new output directory inside the repository.")
    output.mkdir(parents=True)
    pydantic_ai.models.ALLOW_MODEL_REQUESTS = False
    original_hashes = {p: sha(p) for p in HISTORY.iterdir() if p.is_file()}
    revalidation = replay()
    (output / "after-revalidation.json").write_text(json.dumps(revalidation, indent=2) + "\n")
    # Existing E24 writes its frontend subset log; redirect that write too.
    offline.OUT = output
    scenarios = json.loads((HISTORY / "evaluation_scenarios.json").read_text())["scenarios"]
    rows = []
    for scenario in scenarios:
        actual = await offline.execute(scenario)
        checks = actual.get("explicit_constraint_assertions", [])
        fee = actual.get("independent_fee_assertion", {"passed": True})
        passed = actual["outcome"] == scenario["expected"] and all(c["passed"] for c in checks) and fee["passed"]
        rows.append(dict(id=scenario["id"], expected=scenario["expected"], actual=actual["outcome"],
            passed=passed, real_model=actual["real_model"], explicit_checks=checks, fee_check=fee,
            decisions=[{"program_id": d["program_id"], "status": d["eligibility_status"]}
                       for d in actual.get("decisions", [])],
            tools=[t["tool"] for trace in actual.get("traces", []) for t in trace["tools"]],
            live_requests=sum(len(t["model_requests"]) for t in actual.get("traces", [])),
            frontend_exit_code=actual.get("frontend_exit_code")))
    result = dict(method="Offline technical regression; FunctionModel where applicable, not new model evidence or human impact.",
        scenario_sha256=sha(HISTORY / "evaluation_scenarios.json"), live_calls=0,
        passed=sum(r["passed"] for r in rows), failed=sum(not r["passed"] for r in rows), results=rows)
    (output / "scenario-revalidation.json").write_text(json.dumps(result, indent=2) + "\n")
    assert all(sha(p) == h for p, h in original_hashes.items()), "Historical evidence changed"
    assert all(r["passed"] for r in revalidation["results"]), "Replay differed from expected repair"
    assert result["failed"] == 0
    assert all(not r["live_requests"] and not r["real_model"] for r in rows)
    print("Original Advisor rejected; original Designer accepted. 24/24 scenarios passed; zero provider requests; historical evidence unchanged.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    asyncio.run(main(parser.parse_args().output_dir))
