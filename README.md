# Whitney Learning Compass

**From Curriculum Goals to Hands-On Discovery** — Anthony Qiao's Yale MGT 409 AI Foundations for Managers Final Project.

Whitney Learning Compass helps educators, initially teaching Grades 2–7, connect curriculum goals to hands-on experiences at the Eli Whitney Museum & Workshop. It combines a curated catalog of 20 real programs, deterministic grade/fee/duration checks, AI-assisted educational reasoning, explicit teacher selection, and editable Before / During / After learning plans.

**Independent educational prototype based on publicly available Eli Whitney Museum & Workshop program information. Not affiliated with, endorsed by, or operated by the museum.** It does not book visits, send inquiries, take payments, or confirm availability.

## Quick Start for teaching staff

Allow approximately 10 minutes with compatible runtimes, package-network access, and your own authorized course-gateway credentials already available. This is a setup target, **not a completed fresh-clone verification**. No GitHub remote or repository URL has been established yet; obtain the project folder from the authorized submission, then open a terminal at its root (the directory containing this README). A real clone URL will be supplied later.

### 1. Check prerequisites and install dependencies

- **Python 3.11+** is the documented minimum; the existing validated environment used **Python 3.14.7**. Other Python versions have not been freshly validated here.
- **Node 24 is recommended**, previously validated with **Node 24.20.0 / npm 11.19.0**. The application manifest declares Node ≥22.12.0, but the pinned Vitest test dependency supports `^22.12.0 || ^24.0.0 || >=26.0.0`; do not assume odd-numbered Node releases satisfy the complete toolchain. Other supported versions are not separately validated.
- Internet access is needed to install dependencies and use the course gateway. Google Chrome is needed only for the optional browser-regression scripts; the normal application runs in a modern browser.

From the project root on macOS/Linux:

~~~sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock
npm ci --prefix frontend
~~~

On Windows PowerShell:

~~~powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock
npm ci --prefix frontend
~~~

The tracked `requirements.lock` pins the validated Python runtime/development dependencies; direct dependencies are in `requirements.txt` and `requirements-dev.txt`. The tracked `frontend/package-lock.json` pins the frontend and test dependencies. No museum images or remote fonts are required by the application.

### 2. Configure your authorized credentials

Teaching staff must obtain their **own authorized course-gateway access**; access is not bundled or guaranteed. In a text editor, create `.env` at the project root using [.env.example](.env.example), then replace only its placeholder with your authorized key. Do not overwrite an existing credential file. Alternatively, set the values in the backend process environment.

~~~dotenv
PORTKEY_API_KEY=replace-with-course-key
# Optional: use only if supplied by the course.
PORTKEY_VIRTUAL_KEY=
~~~

Precedence is **existing process environment → project `.env` → parent `.env`**, filling only missing variables. A selected blank/invalid key is not silently replaced. Keep credentials server-side; never put them in requests, screenshots, Git, or Vite variables.

The only inference path is **gpt-6-luna** through Portkey's `https://api.portkey.ai/v1/chat/completions`, with `reasoning_effort=none`. Headers include `x-portkey-api-key` and `x-portkey-provider=openai`; an optional virtual-key header supports course-provided routing. There is no provider/model fallback.

### 3. Start both local servers

Open two terminals at the project root. In terminal 1:

~~~sh
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --no-access-log
~~~

Windows equivalent:

~~~powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --no-access-log
~~~

In terminal 2, on either platform:

~~~sh
npm run dev --prefix frontend
~~~

### 4. Open the app and complete a plan

Open **http://127.0.0.1:5173** and follow the teacher walkthrough below. Vite proxies `/api` to `127.0.0.1:8008`; the browser never contacts Portkey directly. Port 5173 is strict: free it rather than silently switching ports. Keep both servers running on loopback with one backend worker.

Health/catalog work without credentials; recommendations and journeys require the server-side course key. “Local service connected” means the backend is reachable, not that provider credentials are valid. If the page cannot reach the local service, check both terminal processes and the exact URL. If the gateway rejects the request, verify authorized server-side configuration; no fallback is attempted.

## Architecture

The React/Vite/TypeScript frontend calls FastAPI. FastAPI coordinates two specialized **PydanticAI agents** using the existing deterministic matching engine:

1. **Program Advisor:** uses read-only catalog/matching tools to explain educational fit among actual programs. Independent code validates every proposed recommendation.
2. **Learning Journey Designer:** runs only after the teacher explicitly selects an offered program and the backend rechecks identity, authorization, and eligibility. It retrieves selected-program facts and generates structured teaching suggestions, followed by independent output validation.

AI reasoning cannot override verified hard constraints. Mandatory unknowns remain provisional; booking and operational confirmation remain separate. Official museum facts are read-only, while teaching suggestions can be edited. The local prototype has no production authentication or persistent workflow database.

### Teacher walkthrough

1. Use **Start with an example** (Force & Motion, Sustainable Energy, or Geometry) or enter your own grade(s), student count and learning goal. Examples fill editable fields without sending a request. Each example resets USD acknowledgment; review the suggested limits and explicitly accept the USD assumption before submitting a budget. Advanced requirements are preserved when switching or clearing examples. Optional budget covers museum program fees only. Add duration and mandatory needs only when required.
2. Click **Discover Programs** once. Review up to three evidence-linked choices, including any provisional options. Compare two or three programs side by side.
3. Click **Select This Program**, review the facts and museum questions, and acknowledge unknown mandatory conditions if applicable.
4. Click **Generate Learning Journey** once. Edit suggestions in the Before, During and After phases; official museum facts remain read-only. No model calls occur when editing or navigating.
5. Review the plan, add teacher notes, and use **Print / Save as PDF**. Edit and copy the museum inquiry draft separately; nothing is sent or booked.

On phones, **Show steps** opens the available navigation; later stages remain locked until their prerequisites are complete. Comparison uses readable attribute groups instead of narrow table columns.

The normal example uses Grade 4, 24 students, a $400 program-fee budget with USD acknowledgment, a 90-minute limit and a force/motion/design goal. Actual options vary; choose a returned candidate, never a fabricated ID.

Private workflow capabilities remain only in tab memory. Refreshing, closing the tab, restarting the backend or letting the one-hour workflow expire requires a new search for **new AI operations**. Saved instructional documents can be recovered locally as described below. A failed journey attempt consumes the workflow; the interface provides a restart path. Ordinary comparison, editing, activity review, printing and copying never initiate inference. Teacher edits are not revalidated by AI and remain the educator's responsibility.

### Local learning-plan drafts

After successful journey generation, the initial plan and subsequent edits autosave after **650 ms** without changes. Check **Saved on this device** before leaving. Before/During/After suggestions, teacher notes, review status and the inquiry draft are included. Saving errors are visible; print a copy if storage is unavailable.

After reopening the same website, choose **Restore Draft** to edit, review or print the saved document without a backend or provider session. **Start Fresh** leaves the saved copy intact. **Delete Saved Draft** asks for confirmation, deletes only the saved browser copy and pauses saving; the open plan remains. Saving again requires **Save This Plan on This Device**. A different new plan requires explicit confirmation before replacing the one saved draft. If another tab changes it, saving pauses and offers a choice; use one editing tab at a time.

Only an allowlisted, validated document is kept in browser `localStorage`: class requirements, original and edited teaching text, minimal historical program facts, source URL/date, notes and inquiry. No workflow capabilities, API credentials, backend run IDs or execution traces are stored. Do not enter student names, private records or secrets in free text. Draft storage is not encrypted, uploaded or shared with the museum. Clearing browser data removes it; private browsing and storage restrictions may prevent saving.

This is **one draft per browser origin**, not a backup or cross-device service. Use the same hostname and port (`127.0.0.1:5173` differs from `localhost:5173`). The frontend must still be served locally to reopen it; no offline app cache is added. Restored facts and original eligibility are labeled **Saved Draft — Not Revalidated**, including in print. They are historical snapshots, not current museum information or booking confirmation. **Start New Plan** follows the normal intake, recommendation and explicit selection process; restoration never recreates expired server authorization. See [Stage 4.4 validation](docs/stage4_4_validation.md) for tests and limitations.

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

This standard suite follows `pytest.ini` and collects `tests/`. No credentials are required. FunctionModel and mock HTTP responses are labeled simulated; backend tests disable real model requests. Original Stage 2 tests remain unchanged. This command does not overwrite historical validation artifacts.

The **separate evaluation harness** is not collected by the default suite. Run it explicitly from the project root:

~~~sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest evaluation/test_harness.py -q -p no:cacheprovider --basetemp=.test-tmp/evaluation
~~~

It checks evaluation budgets, context membership, and cost arithmetic offline; it does not rerun the live Tokenomics experiment. On Windows, use `.\.venv\Scripts\python.exe` and set `$env:PYTHONDONTWRITEBYTECODE="1"` before the pytest command instead of the POSIX environment prefix.

The deterministic engine remains available through `matching.load_catalog()`, `match_catalog()` and `match_program()`.

Frontend validation (no credentials or real model calls):

~~~sh
npm test --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
~~~

Vitest/Testing Library tests use explicitly mocked API responses; they are not live inference.

### Historical browser and artifact scripts

Optional browser-regression scripts under `frontend/scripts/` use installed Google Chrome and local servers, with saved response replay where documented. They write to historical artifact directories. **Do not run them unchanged during ordinary setup or overwrite preserved evidence.** If a new browser run is later authorized, first select a separate output location and follow the script's documented prerequisites. `browser-walkthrough.mjs --live` performs paid inference; it is not part of the offline test commands.

Likewise, `python -m matching.audit` regenerates catalog audit/coverage files. The existing evidence is already included; regeneration is not required to run the app.

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

## Final report and presentation

Open these approved files directly in a browser; no application server is required:

- [Final report](report.html) — 13 US Letter pages; screenshots, diagrams and styles are embedded.
- [Final slides](slides.html) — 10 reveal.js slides; arrow keys navigate and **F** enters fullscreen. Screenshots and custom diagrams are embedded. Network access is required for the pinned reveal.js 5.2.1 CDN assets.
- [Final report PDF](artifacts/stage5c/report-print.pdf) — 13 US Letter pages.
- [Slide PDF overview](artifacts/stage5c/slides-overview.pdf) — 10 widescreen pages; retained as a convenient static review artifact.

These four files are **frozen authoritative deliverables**. Do not run `artifacts/stage5c/build.py` (including `--report-only`) or earlier Stage 5C QA/authoring scripts to regenerate them: those historical scripts can overwrite the approved slide design, restore superseded report headings, or overwrite QA evidence. They are not an application build step. The report cover's GitHub URL placeholder remains intentionally unresolved until a real repository URL and a later targeted update are authorized.

See the [submission manifest](docs/stage5d-submission-manifest.md) for the exact recommended tracking set and exclusions. It is a recommendation, not evidence that files have already been staged or published.

## Review evidence and recorded validation

- [Authoritative PRD](docs/project_scope.md), retaining its original stage-history wording.
- [Report evidence map](docs/report_evidence_map.md), [Tokenomics analysis](docs/tokenomics_analysis.md), and [Safety evaluation](docs/safety_evaluation.md).
- [P01 exploratory impact study](docs/impact_study_results.md): one graduate-student proxy participant, not a K–12 educator; timing excludes AI waiting and is not a causal or generalizable productivity result.
- [Stage 5A–5B validation](docs/stage5a_b_validation.md) and [targeted reliability repairs](docs/stage5b1_reliability_validation.md).
- [Stage 4.4 validation](docs/stage4_4_validation.md): local draft saving/recovery and historical print checks.
- [Stage 4.3 validation](docs/stage4_3_validation.md) and [Stage 4.2 validation](docs/stage4_2_validation.md): museum-inspired design, Quick Start and mobile experience.
- [Stage 4.1 validation](docs/stage4_1_validation.md), [Stage 4 validation](docs/stage4_validation.md), and [Stage 3 validation](docs/stage3_validation.md): interface, actual runs, usage, failures and limitations.
- [Stage 2 validation](docs/stage2_validation.md), [matching rules](docs/matching_rules.md), [data dictionary](docs/data_dictionary.md), [catalog research](docs/catalog_research.md), and [coverage](docs/catalog_coverage.md).
- [Actual Stage 3 run artifacts](artifacts/agent_runs/).

Previously recorded Stage 5B.1 receipts report **284 passing Python product tests**, **153 passing frontend tests**, **six passing separate evaluation-harness tests**, and successful TypeScript/build checks. See [Python receipt](artifacts/stage5b1/python-tests.txt), [frontend receipt](artifacts/stage5b1/frontend-tests.txt), [harness receipt](artifacts/stage5b1/harness-tests.txt), [typecheck receipt](artifacts/stage5b1/typecheck.txt), and [build receipt](artifacts/stage5b1/build.txt). These are historical results, not new test execution or fresh-clone verification in Stage 5D-2. Genuine live execution, offline replay and simulated tests remain distinctly labeled.

## Current limitations

Generated-prose guards are conservative heuristics, not proof of factual entailment or educational quality. Educator review remains required. Missing catalog facts and booking conditions remain unconfirmed; recorded facts are not live museum availability or binding quotes. Fees exclude transport and other unverified trip costs.

The reported Advisor context/cost comparison is limited; output quality was not proven equivalent, the paired Designer comparison was not completed, and public-rate estimates are not gateway billing. P01 offers exploratory proxy-user evidence, not measured classroom impact or teacher validation. Further educator/museum evaluation, operational feasibility and full deployment costs remain future work.

The application is a local academic prototype. No online deployment, booking, payments, email sending, runtime scraping or production authentication is included. Repository publication and fresh-clone validation remain pending separate authorization.
