# Whitney Learning Compass

Independent MGT 409 educational prototype for the Eli Whitney Museum & Workshop. Stage 3 adds two PydanticAI agents and a local FastAPI backend to the preserved Stage 2 catalog and matching engine. Not an official museum product or booking service. No frontend is implemented.

## Setup

Use Python 3.11 or later; validated here with Python 3.14. From the project root:

~~~sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock
~~~

The lock file pins the complete validated runtime/development environment. Direct runtime requirements are in requirements.txt; requirements-dev.txt includes test dependencies. On Windows use .venv\Scripts\python.exe.

For live inference, provide the course key through the process environment or a local .env file based on [.env.example](.env.example). Never put secrets into requests, screenshots, artifacts or Git. Precedence: existing process environment → project .env → parent .env, filling only absent values. A selected blank/invalid key is not silently replaced. PORTKEY_VIRTUAL_KEY is optional course-provided routing.

The only model path is gpt-6-luna through https://api.portkey.ai/v1/chat/completions with reasoning_effort=none. Headers include x-portkey-api-key and x-portkey-provider=openai. No direct-provider/model fallback exists.

## Run locally

~~~sh
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --no-access-log
~~~

API schema: http://127.0.0.1:8008/docs. Health/catalog work without credentials. Keep this prototype on localhost with one worker; it has no production user authentication or persistent workflow database. Browser-origin requests are blocked pending Stage 4 integration.

| Endpoint | Purpose |
| --- | --- |
| GET /api/health | Local process health, not provider readiness. |
| GET /api/programs | Validated local catalog with evidence and unknowns. |
| POST /api/recommend | Teacher intake → deterministic checks → Advisor tools → validated choices. |
| POST /api/journey | Explicit human selection → revalidation → Designer → validated plan. |
| GET /api/runs/{run_id} | Redacted execution metadata; requires X-Workflow-Token. |

Recommendation request:

~~~json
{
  "grades": [4],
  "student_count": 24,
  "learning_goal": "Understand force, motion, and engineering design through hands-on experiments.",
  "max_program_fee": 400,
  "budget_currency": "USD",
  "assume_usd": true,
  "max_duration_minutes": 90,
  "preferences": [],
  "required_standards": [],
  "mandatory_operational": {}
}
~~~

Response: workflow_id, workflow_token, run_id, eligible recommendations, separately labeled provisional_options, and all deterministic eligibility_results. At most three choices are generated, with no forced minimum. Backend code supplies museum facts, fees, duration, warnings and sources. The model supplies educational reasoning.

After reviewing the choices, explicitly select an offered ID. Send the returned token in the X-Workflow-Token header with:

~~~json
{
  "workflow_id": "<UUID returned by /api/recommend>",
  "program_id": "ewm-catapult",
  "teacher_selected": true,
  "acknowledge_unknown": false
}
~~~

Use acknowledge_unknown=true only after accepting unresolved mandatory requirements for a provisional draft. Rejected/unoffered IDs are blocked. Each workflow permits one journey attempt and expires after one hour; restarting invalidates in-memory workflows. Failed journey attempts consume that allowance.

Journeys separate museum_facts from ai_teaching_suggestions, include before/during/after phases, and retain unanswered operational questions. booking_confirmed is always false. A USD-assumption eligibility pass does not certify booking or total trip cost.

## Offline automated tests

~~~sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider --basetemp=.test-tmp --junitxml=artifacts/stage3_pytest.xml
~~~

No credentials are required. FunctionModel and mock HTTP responses are labeled simulated; backend tests disable real model requests. Original Stage 2 tests remain unchanged. This command does not overwrite historical Stage 2 pytest artifacts.

The deterministic engine remains available through matching.load_catalog(), match_catalog() and match_program(). Its optional python -m matching.audit command regenerates Stage 2 audit/coverage files without inference; it was not needed to change preserved Stage 2 evidence during Stage 3.

## Explicit live demonstrations

These commands spend course model usage; tests and server startup never run them automatically.

~~~sh
.venv/bin/python -m scripts.smoke
.venv/bin/python -m scripts.live_demo recommend --case a --label my-case-a-advisor
# Stop, review recommendations, and obtain an explicit teacher selection.
.venv/bin/python -m scripts.live_demo journey --case a --label my-case-a-journey --program-id ewm-catapult --teacher-selected
.venv/bin/python -m scripts.live_demo recommend --case b --label my-case-b
.venv/bin/python -m scripts.live_demo recommend --case c --label my-case-c
~~~

Use the journey example only if Catapult was returned and selected. Case B uses a $200 program-fee budget. Case C requires verified capacity. --in-process runs recommendation-only diagnostics through the FastAPI ASGI interface with real Portkey inference; it does not retain a resumable workflow after exit.

Use unique labels: existing evidence cannot be overwritten. Sanitized class-level demo requests/responses/traces go to artifacts/agent_runs/. Private workflow tokens remain in ignored .runtime/ files. Review new artifacts for personal information before publication. Ordinary calls persist redacted execution metadata in .runtime/runs/; educator input remains in bounded in-memory workflows.

Errors return an error object with code, message and optional run_id. Invalid input: 422; invalid workflow/token: 404; consumed/changed workflow: 409; execution limit: 429; missing configuration: 503; provider/output failure: 502; timeout: 504. Raw provider bodies and exception traces are not returned.

## Review evidence

- [Authoritative PRD](docs/project_scope.md), retaining its original stage-history wording.
- [Stage 3 validation](docs/stage3_validation.md): actual runs, usage, safety tests, failures and limitations.
- [Stage 2 validation](docs/stage2_validation.md): original checkpoint.
- [Matching rules](docs/matching_rules.md) and [data dictionary](docs/data_dictionary.md).
- [Catalog research](docs/catalog_research.md) and [coverage](docs/catalog_coverage.md).
- [Actual Stage 3 run artifacts](artifacts/agent_runs/).

Generated prose has deterministic safety/claim guards, but they are conservative heuristics, not proof of every sentence's factual entailment or educational quality. Educator review remains required. Teacher impact evaluation and full Tokenomics experiments remain future work.

No React frontend, deployment, booking, payments, email, runtime scraping, report.html or slides.html is included. Stage 4 requires separate authorization.
