# Whitney Learning Compass

Independent MGT 409 educational prototype for the Eli Whitney Museum & Workshop. Stage 4 adds a React/TypeScript teacher experience to the two PydanticAI agents, local FastAPI backend, and preserved 20-program catalog and matching engine. Not an official museum product or booking service.

## Setup

Use Python 3.11 or later; validated here with Python 3.14. From the project root:

~~~sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock
~~~

The lock file pins the complete validated runtime/development environment. Direct runtime requirements are in requirements.txt; requirements-dev.txt includes test dependencies. On Windows use .venv\Scripts\python.exe.

For live inference, provide the course key through the process environment or a local .env file based on [.env.example](.env.example). Never put secrets into requests, screenshots, artifacts or Git. Precedence: existing process environment → project .env → parent .env, filling only absent values. A selected blank/invalid key is not silently replaced. PORTKEY_VIRTUAL_KEY is optional course-provided routing.

The only model path is gpt-6-luna through https://api.portkey.ai/v1/chat/completions with reasoning_effort=none. Headers include x-portkey-api-key and x-portkey-provider=openai. No direct-provider/model fallback exists.

## Frontend setup

Use Node.js 22.12 or newer (validated with Node 24.20.0 and npm 11.19.0). From the project root:

~~~sh
npm ci --prefix frontend
~~~

The committed package-lock.json pins the frontend and test dependencies. No museum images or remote fonts are required. All model credentials stay in Python; do not create Vite credential variables.

## Run the complete application locally

Open two terminals at the project root. In terminal 1, start the backend:

~~~sh
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --no-access-log
~~~

In terminal 2, start the frontend:

~~~sh
npm run dev --prefix frontend
~~~

Open **http://127.0.0.1:5173**. Vite proxies /api to 127.0.0.1:8008; it does not contact Portkey. Exact local frontend/backend origins are permitted, with no wildcard CORS. Port 5173 is strict: free it rather than silently switching ports.

Health/catalog work without credentials; recommendations and journeys require the server-side course key. “Local service connected” means the backend is reachable, not that provider credentials are valid. Keep both servers on loopback with one backend worker. This prototype has no production authentication or persistent workflow database.

### Teacher walkthrough

1. Use **Start with an example** (Force & Motion, Sustainable Energy, or Geometry) or enter your own grade(s), student count and learning goal. Examples fill editable fields without sending a request. Each example resets USD acknowledgment; review the suggested limits and explicitly accept the USD assumption before submitting a budget. Advanced requirements are preserved when switching or clearing examples. Optional budget covers museum program fees only. Add duration and mandatory needs only when required.
2. Click **Discover Programs** once. Review up to three evidence-linked choices, including any provisional options. Compare two or three programs side by side.
3. Click **Select This Program**, review the facts and museum questions, and acknowledge unknown mandatory conditions if applicable.
4. Click **Generate Learning Journey** once. Edit suggestions in the Before, During and After phases; official museum facts remain read-only. No model calls occur when editing or navigating.
5. Review the plan, add teacher notes, and use **Print / Save as PDF**. Edit and copy the museum inquiry draft separately; nothing is sent or booked.

On phones, **Show steps** opens the available navigation; later stages remain locked until their prerequisites are complete. Comparison uses readable attribute groups instead of narrow table columns.

The normal example uses Grade 4, 24 students, a $400 program-fee budget with USD acknowledgment, a 90-minute limit and a force/motion/design goal. Actual options vary; choose a returned candidate, never a fabricated ID.

Edits and private workflow capabilities live only in tab memory. Refreshing, closing the tab, restarting the backend or letting the one-hour workflow expire requires a new search. Print your work before leaving. A failed journey attempt consumes the workflow; the interface provides a restart path. Ordinary comparison, editing, activity review, printing and copying never initiate inference. Teacher edits are not revalidated by AI and remain the educator's responsibility.

API schema for developers: http://127.0.0.1:8008/docs.

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
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider --basetemp=.test-tmp
~~~

No credentials are required. FunctionModel and mock HTTP responses are labeled simulated; backend tests disable real model requests. Original Stage 2 tests remain unchanged. This command does not overwrite historical validation artifacts.

The deterministic engine remains available through matching.load_catalog(), match_catalog() and match_program(). Its optional python -m matching.audit command regenerates Stage 2 audit/coverage files without inference; it was not needed to change preserved Stage 2 evidence during Stage 3.

Frontend validation (no credentials or real model calls):

~~~sh
npm test --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
~~~

Vitest/Testing Library tests use explicitly mocked API responses; they are not live inference. Optional Chrome checks require Google Chrome installed and the Vite server running:

~~~sh
cd frontend
node scripts/browser-regression.mjs
~~~

The current Stage 4.2 regression is `node scripts/browser-stage4-2.mjs` (both local servers running). It replays saved POST responses across six viewport widths and writes only `artifacts/stage4_2/`. It makes no provider requests.

This offline browser check replays saved responses, scans eight screens with axe, and regenerates clearly named offline visual artifacts. It makes no provider requests. The separate `node scripts/browser-walkthrough.mjs --live` performs real inference and intentionally refuses to overwrite existing browser-live.json. Review and choose a new evidence directory in that script before a deliberate new run; never delete prior evidence merely to repeat it. It uses the documented Catapult demonstration selection.

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
- [Stage 4.2 validation](docs/stage4_2_validation.md): museum CSS audit, Quick Start, mobile experience and offline test evidence.
- [Stage 4.1 validation](docs/stage4_1_validation.md): input clarity, evidence presentation and print refinements.
- [Stage 4 validation](docs/stage4_validation.md): frontend, browser evidence, tests and remaining limitations.
- [Stage 3 validation](docs/stage3_validation.md): actual runs, usage, safety tests, failures and limitations.
- [Stage 2 validation](docs/stage2_validation.md): original checkpoint.
- [Matching rules](docs/matching_rules.md) and [data dictionary](docs/data_dictionary.md).
- [Catalog research](docs/catalog_research.md) and [coverage](docs/catalog_coverage.md).
- [Actual Stage 3 run artifacts](artifacts/agent_runs/).

Generated prose has deterministic safety/claim guards, but they are conservative heuristics, not proof of every sentence's factual entailment or educational quality. Educator review remains required. Teacher impact evaluation and full Tokenomics experiments remain future work.

Stage 4 is ready for review. No deployment, booking, payments, email sending, runtime scraping, report.html or slides.html is included. Stage 5, measured teacher impact and full Tokenomics require separate authorization. No Stage 4 Git commit or GitHub push is performed automatically.
