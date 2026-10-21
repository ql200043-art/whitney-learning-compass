# Whitney Learning Compass

Stage 2: a curated official program catalog and a local deterministic matching engine. Independent MGT 409 educational prototype; not an official museum product.

**Review status:** Stage 2 implemented and tested; Stage 3 agents, API and frontend are not implemented.

## Run locally

Python 3.11 or later is required. Validated here with Python 3.14 and pytest 9.1.1. The matching module itself uses only the Python standard library and needs no API key or network access.

From this project directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q -p no:cacheprovider --basetemp=.test-tmp --junitxml=artifacts/pytest.xml
.venv/bin/python -m matching.audit
```

On Windows, use `.venv\Scripts\python.exe` in place of `.venv/bin/python`. The audit writes local catalog integrity, coverage and matching demonstration artifacts; it does not access museum pages or models.

## Match a teacher request

```python
from matching import load_catalog, match_catalog

results = match_catalog(load_catalog(), {
    "grades": [4],
    "student_count": 24,
    "max_program_fee": 400,
    "budget_currency": "USD",
    "assume_usd": True,
    "max_duration_minutes": 90,
    "preferences": ["force and motion"],
})
eligible = [r for r in results if r["eligibility_status"] == "pass"]
catapult = next(r for r in results if r["program_id"] == "ewm-catapult")
print(catapult["eligibility_status"], catapult["program_fee"]["subtotal"])
# Actual saved demonstration: pass 336.00
```

A pass is program eligibility under the displayed assumptions, **not a confirmed booking**. Use `mandatory_operational={"capacity": True}` when verified capacity is mandatory; unverified capacity then produces unknown unless another constraint fails. The engine returns every catalog record with reasons, and never pads the result to three programs.

## Review artifacts

- [Authoritative PRD](docs/project_scope.md): approved Stage 1.1 policy; original stage-history wording retained.
- [Matching rules and API contract](docs/matching_rules.md).
- [Official research ledger](docs/catalog_research.md).
- [Grade × Theme coverage](docs/catalog_coverage.md).
- [Stage 2 validation](docs/stage2_validation.md).
- [Actual matching demonstrations](artifacts/matching_demonstrations.json).
- [Actual pytest output](artifacts/pytest.txt) and [JUnit results](artifacts/pytest.xml).

`data/programs.json` preserves the original `id` field; engine output names it `program_id`. Source facts and editorial themes remain separate. See the [data dictionary](docs/data_dictionary.md) for schema and documented Stage 2 clarifications.

No project inference calls, booking/payment functions, runtime scraping, agents, API endpoints, UI, report.html or slides.html are included.
