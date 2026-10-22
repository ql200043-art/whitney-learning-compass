# Stage 3 validation — AI agents and backend workflow

**Executed:** October 22, 2026 (America/New_York). Timestamps in JSON traces are UTC.  
**Starting checkpoint:** f59719b90ea7c881a1d90129bad6dcd9f34776e1.  
**Scope:** Stage 3 only. No frontend, deployment, report.html, slides.html, push or new commit.

## Outcome and preservation

Both specialized PydanticAI agents and the FastAPI backend are implemented. A real teacher-input → recommendations → explicit user selection → complete learning-journey workflow succeeded through the course Portkey gateway. Budget-failure and mandatory-uncertainty scenarios were also executed. Failed attempts are retained, not relabeled as successes.

Before implementation, the original 124 Stage 2 tests passed in 0.37 seconds. The final suite includes all those tests plus 79 Stage 3 tests. The 20-program catalog, all five original pilots, matching modules, coverage data, and Stage 1/2 documentation/evidence remain unchanged from the checkpoint. No matching compatibility adjustment was needed.

The PRD remains authoritative. Its old stage-status wording is historical; it was not rewritten to imply later work occurred earlier.

## Architecture and division of responsibility

~~~text
Validated teacher input
    → original load_catalog / match_catalog / validate_requirements
    → Program Advisor + read-only registered tools
    → independent ID/category/evidence/prose validation
    → authoritative facts and all deterministic decisions returned
    → STOP: teacher explicitly selects an offered candidate
    → workflow token + identity + catalog digest + match_program revalidation
    → Learning Journey Designer + selected-program tool
    → three-phase schema/evidence/prose validation
    → editable suggestions beside catalog facts, warnings and run metadata
~~~

The backend owns orchestration. The agents do not delegate to one another.

| Agent | Actual responsibility | Registered tools |
| --- | --- | --- |
| Program Advisor | Interpret natural-language educational goals; explain relevance; propose at most three real eligible/provisional choices. | search_matching_programs, get_program_details, get_program_evidence |
| Learning Journey Designer | Draft age-appropriate before/during/after suggestions for the human-selected program. | get_selected_program |

Tools wrap the real matching/catalog code. They accept no arbitrary paths, URLs, changed budgets, grades, models or credentials. Tool context contains the validated teacher request; an agent cannot replace its hard requirements. Search returns compact eligible/unknown records; rejected decisions remain visible in the API's full deterministic results.

## Model and environment configuration

- PydanticAI: pydantic-ai-slim[openai] 1.107.7.
- Adapter: OpenAIChatModel with a custom AsyncOpenAI client and OpenAIProvider.
- Fixed requested model: gpt-6-luna.
- Observed provider-reported model: gpt-6-luna-2026-09-22.
- Fixed gateway: https://api.portkey.ai/v1/chat/completions.
- reasoning_effort=none; structured output uses PydanticAI output tools.
- Headers: x-portkey-api-key, x-portkey-provider=openai, optional x-portkey-virtual-key. Authentication remains server-side.
- SDK retries and PydanticAI validation retries: zero. No fallback model, provider or alternate credential path.
- HTTP hooks reject a different URL, model or reasoning setting and validate the reported model family.

The [official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna) specifies the none reasoning setting for Chat Completions function calling. [PydanticAI's OpenAI documentation](https://pydantic.dev/docs/ai/models/openai/) describes custom clients and the distinction from Responses. The successful Homework 5 connection configuration was inspected read-only; no business logic, agent workflow or credentials were copied.

Environment precedence is process → project .env → parent .env, filling only missing values and never replacing an already selected key. Existing blank/invalid keys produce an actionable error. Actual .env files, .venv, caches, .runtime and logs are ignored. The example contains placeholders only. A process key was available; no secret value was printed.

A smoke test verified actual tool use and structured output before the full workflow was implemented. Plain-text completion alone was not used as compatibility evidence.

## API and human selection contract

[README](../README.md) includes installation, start commands and request examples. Runtime dependencies and a complete pinned environment are in requirements.txt and requirements.lock.

| Endpoint | Behavior |
| --- | --- |
| GET /api/health | Local health without model calls; not a provider readiness guarantee. |
| GET /api/programs | Reviewed local catalog with evidence and unknowns. |
| POST /api/recommend | TeacherRequest → Advisor → RecommendationResponse. |
| POST /api/journey | JourneyRequest plus X-Workflow-Token → JourneyResponse. |
| GET /api/runs/{run_id} | Redacted trace associated with the workflow token. |

TeacherRequest includes concrete grade list, positive student count, learning_goal, optional fee budget/currency/USD assumption, duration limit, preferences, standards requirements and mandatory operational requirements. Original matching.validate_requirements enforces the Stage 2 semantics; typed models add length and request-size limits.

RecommendationResponse returns a random workflow ID, capability token, run ID, eligible recommendations, separate provisional_options, full deterministic eligibility_results and a requirement to select explicitly. Factual fields are constructed from catalog records and matching results, never copied from model-generated facts.

JourneyRequest requires the workflow ID, a returned program ID and strictly boolean teacher_selected=true. Provisional planning also requires acknowledge_unknown=true. The token must belong to that workflow. Selection checks run before inference. The catalog digest and selected program's eligibility are rechecked; changed catalogs require new recommendations. Each workflow allows one journey attempt, expires after one hour, and is lost on restart. This limits repeated spend; a failed journey attempt is also consumed.

The actual Case A user explicitly selected Catapult in response to the recommendation choices. Only after that reply was the separate journey request sent. There is no automatic choice or automatic transition between agents.

## Independent validation and safety boundaries

- Actual program IDs only; duplicates and fabricated IDs are rejected.
- pass may be presented as eligible; unknown only as provisional; fail cannot be offered.
- Failure precedence, currency interpretation, fees and durations come from the original engine.
- Names, URLs, original $ amounts, null ISO codes, grade labels, sources and unpublished standards are populated directly from the catalog.
- Evidence pointers must resolve to an actual field and the correct source, including the original schema's inherited parent evidence.
- A citation documenting a null/unknown field is permitted as evidence of uncertainty; it cannot change eligibility or turn the missing fact into a known value.
- Required registered tools must actually execute before agent output is accepted.
- Pydantic models forbid unexpected output fields and require all three journey phases, objectives, inquiry prompts, reflection and assessment.
- Six operational confirmation items remain visible. booking_confirmed is always false.
- Museum facts and AI teaching suggestions have separate response fields and explicit labels.
- Resourceful Schools' published time, fee and two-session ambiguity remain unchanged and appear in confirmation questions.
- Source text is data, not executable instructions. Recognizable source/user instruction overrides, credential requests, personal contact information and unsafe activity patterns are rejected.
- Generated prose guards reject common fabricated prices/durations/standards, booking claims, museum delivery promises, private information and unsafe equipment directions.
- No raw provider exception text, response body or credentials are returned in errors. Logs redact selected secrets, common credential/contact patterns and workflow tokens.

These are layered controls, not a claim of complete semantic safety. Free-form educational explanations are not automatically proven entailed by every source sentence. The rule-based prose filters can miss paraphrases or reject benign language; educator review is still required. No empirical teacher/student impact claim is made.

## Execution and privacy limits

| Limit | Implemented value |
| --- | --- |
| Model requests per agent invocation | 4, including tool-response rounds |
| Recommendation + one journey | At most 8 model requests |
| Successful registered tool calls per agent | 6 |
| SDK / model-output retries | 0 / 0 |
| Model completion maximum | 2,400 tokens per response |
| PydanticAI cumulative usage guard per agent | 32,000 input / 6,500 output tokens |
| Per-agent wall time / per-HTTP-request timeout | 90 seconds / 30 seconds |
| Outbound request body / individual tool-result size | 70,000 bytes / 24,000 bytes |
| Incoming POST body | 12,000 bytes |
| Learning goal / preferences | 2,000 characters / eight strings of up to 120 characters |
| Concurrent agent invocations / active workflows | 2 / 100 |
| Workflow lifetime / journey attempts | One hour / one attempt |

Usage token guards are checked using reported usage between rounds and can overshoot by one response; the hard request count and per-response output cap independently bound execution. Provider-side hidden processing is outside application control. Failures are returned clearly rather than retried indefinitely. The manual Case C diagnosis and repair were separate, preserved runs, not invisible retries.

The local server uses loopback, no permissive CORS, and a restricted Host list. It is not ready for public deployment. There is no account system or cross-process workflow store. Private workflow state stays in memory; sanitized trace files in ignored .runtime/runs are local operational records. Failed recommendations may only be inspected through local trace files because no valid workflow/token is returned.

Persisted local trace files do not automatically expire; remove/archive them deliberately before longer-term use. Do not treat heuristic redaction as permission to collect personal student data. Inputs ask only for class-level needs.

## Real execution evidence and usage

All entries below are actual Portkey attempts, not FunctionModel tests. Full sanitized requests, responses, tool arguments/results, IDs, validation outcomes and HTTP usage records are in [artifacts/agent_runs](../artifacts/agent_runs/).

| Artifact / result | Input tokens | Cached input | Output tokens | Requests | Agent latency, seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| smoke-bef916e7-9aa2-46ba-8c0c-1e2d4585de6f.json — passed | 344 | 0 | 32 | 2 | 5.172 |
| case-a-advisor.json — passed | 5,127 | 0 | 355 | 2 | 8.090 |
| case-a-journey.json — passed | 4,403 | 0 | 772 | 2 | 11.721 |
| case-b-advisor.json — passed | 1,418 | 0 | 60 | 2 | 4.471 |
| case-c-advisor.json — rejected | 11,143 | 4,504 | 199 | 3 | 5.759 |
| case-c-diagnostic.json — rejected, diagnosis captured | 11,143 | 4,504 | 199 | 3 | 1.840 |
| case-c-validated.json — passed | 11,143 | 4,504 | 199 | 3 | 1.307 |

Cached counts are provider-reported, not assumed zeros. HTTP hooks preserve null when a field is absent. Costs remain null because course-gateway pricing/charges were not established. Observed tokens are not presented as a bill or a Tokenomics comparison.

Across the seven responded attempts: **44,721 input tokens, 13,512 cached input tokens, 1,816 output tokens and 17 model requests**. Cached tokens are a subset of input, not additional tokens. This includes the two rejected Case C attempts.

The earlier sandboxed smoke attempt, smoke-4ac88173-1e0b-431f-8eba-5b58dd8e35e1.json, recorded one attempted outbound request, no provider response and null usage; it is not counted as a successful model request or assigned an invented token cost. Sandbox network/local-port restrictions were resolved through explicit execution approvals.

### Case A — completed human-selected workflow

Input: Grade 4, 24 students, $400 program-fee budget, explicit USD assumption, 90-minute maximum, and force/motion/engineering-design learning goal.

The Advisor returned Catapult, Marble Roller Coaster and Simple Machines, all passing the applicable deterministic checks. It supplied conceptual educational reasoning, not only exact keyword scores. The user selected Catapult.

Catapult's factual output preserves $14/student, **$336 class program-fee subtotal**, 90 published minutes and null official currency code. The three-phase plan includes prediction/observation preparation, staff-directed comparison prompts, paper-based evidence collection, reflection and objective-linked assessment. It retains the supplied-ball safety condition and all operational confirmation questions.

The plan includes a clearly labeled hypothetical observation as one suggested paper exercise; it does not report that as an actual student observation or measured impact. The educator can replace that suggestion with actual visit notes.

Actual registered function calls:

- Advisor search_matching_programs: call_dQmMPUmC4mrDQ7EaTVDq0Eg4.
- Designer get_selected_program: call_WMa01C8L8f4PziCSnvyCKKQk.
- Both also returned structured final_result output tool calls.

Run IDs: e0bd4346-a8f2-4004-a440-aeca4d61f9d3 and ecf8b22b-0604-4ed2-a6a6-3d6a007d3eb3. Plan ID: 1b76b74d-0d34-4769-bffd-4b8125e5aa87.

Combined agent execution: **9,530 input tokens, 0 reported cached input tokens, 1,127 output tokens, four model requests and 19.811 seconds**. This sum excludes the human decision interval and is not a measured educator task-completion time. Both saved outputs were revalidated with the final validators after the uncertainty-citation fix.

### Case B — confirmed budget failure

With the same class and a $200 program-fee budget, even the least expensive published class subtotal exceeds the budget. The Advisor invoked search_matching_programs, received no eligible/unknown candidates, and returned no recommendations. The full API response retains the deterministic failures, including Catapult's $336 subtotal. It did not invent a cheaper option or override the budget.

### Case C — missing duration and mandatory capacity

The request focused on structural engineering/bridges and explicitly required verified class capacity. The successful final response offers Bridges **only as provisional**. Grade and fee checks pass; published duration and mandatory capacity remain unknown. No booking is confirmed.

The first attempt was rejected without an accepted response. A bounded diagnostic retry captured the exact issue: the model correctly cited /group_size/max_students as evidence of uncertainty, but the initial output validator incorrectly demanded verified, directly mapped evidence. The final validator now resolves inherited pointers and allows citations documenting unknowns. It still independently enforces provisional classification. Two regression tests establish both sides of that rule.

The final real retry passed. Tool traces show search_matching_programs and get_program_details; all three attempts and their actual usage are preserved.

## Automated validation

The final suite ran with no real inference:

~~~sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider --basetemp=.test-tmp --junitxml=artifacts/stage3_pytest.xml
~~~

**203 tests passed in 1.82 seconds; zero failures, errors or skips.** See [captured stdout](../artifacts/stage3_pytest.txt) and [JUnit XML](../artifacts/stage3_pytest.xml) for individual test evidence. This comprises all 124 unchanged Stage 2 tests plus 79 Stage 3 cases.

Tests cover input validation, actual Stage 2 function integration, fee/grade precedence, provisional acknowledgment, fabricated/unoffered/cross-workflow selection, revalidation after catalog changes, single-use journey limits, all three phases, unknown standards/duration, Resourceful Schools ambiguity, user/source prompt injection, model-output rejection, forged/inherited evidence, HTTP errors, timeout, missing keys, environment precedence, tool/context/request limits, redaction, actual SDK retry suppression, provider model identity and cached-usage null handling.

FunctionModel tests are labeled simulated and disable real model requests. MockTransport tests exercise the real SDK adapter without contacting a provider. No simulated usage appears in the live-run table.

During development, nine transport-test cases initially failed because the test double replaced a class with a function. After using a proper subclass, three mock-success cases revealed a missing total_tokens field in the synthetic provider fixture. Both fixture defects were corrected, and the complete final suite passed. These were not successful live runs or changes to museum data.

The safety cases are reproducible technical tests, not proof that every possible adversarial prompt is defeated. Teacher evaluation, the planned 20-scenario educational evaluation and full Tokenomics comparison remain later work.

## Files created or modified

Modified: README.md, .gitignore, requirements-dev.txt.

Created:

- .env.example, requirements.txt, requirements.lock.
- backend/__init__.py, config.py, gateway.py, models.py, safety.py, validation.py, agents.py, service.py, main.py.
- scripts/__init__.py, smoke.py, live_demo.py.
- tests/test_backend.py, tests/test_gateway.py.
- docs/stage3_validation.md.
- artifacts/stage3_pytest.txt, artifacts/stage3_pytest.xml.
- artifacts/agent_runs/case-a-advisor.json, case-a-journey.json, case-b-advisor.json, case-c-advisor.json, case-c-diagnostic.json, case-c-validated.json.
- artifacts/agent_runs/smoke-4ac88173-1e0b-431f-8eba-5b58dd8e35e1.json and smoke-bef916e7-9aa2-46ba-8c0c-1e2d4585de6f.json.

Ignored .venv installations, .runtime trace/token files and test temporary files are local development artifacts, not intended Git additions. No actual .env was created. No key is hard-coded.

## Remaining limitations and Stage 4 gate

Final boundary and documentation checks passed. The outside-project inventory matched for 195,878 workspace files using path, size, modification time and mode (metadata SHA-256 e745309829d9bc4f36bd42f5b805e98dd705f81b2bd62071d1ad55ba83fd3ce2). This is a metadata comparison, not a hash of every outside file's contents. All project changes were confined to whitney-learning-compass.

Only README.md, .gitignore and requirements-dev.txt changed among the original committed files. No catalog, matching module, original test, PRD, historical receipt or Stage 2 artifact changed. Exact configured-secret scanning found no secret values in Git-visible project files, and exported workflow tokens are redacted. Ignore-rule checks passed. Ten Markdown files and 47 local links passed source-structure checks. Git remains at the original checkpoint, with no remote and no new commit. The temporary localhost validation server was shut down cleanly after the live tests.

- Workflow storage is deliberately in-memory and single-process. Restart requires a fresh recommendation, and the capability token is not production account authentication.
- Prose guards are heuristic. Educator review is required for activity quality, safety, accessibility and scientific phrasing.
- The real generated follow-up exercise is editable; prefer actual observations for an eventual classroom assessment.
- Unknown durations, standards, capacity, accommodations, availability and the Resourceful Schools delivery ambiguity remain unresolved source questions.
- Model outputs vary. This small live sample does not establish a statistical reliability or superiority claim.
- No actual teacher impact evaluation, full cost experiment, bill estimate, deployment, UI screenshot or demo video was fabricated.

Stage 3 is ready for review. Stop before Stage 4; do not commit or push automatically.

