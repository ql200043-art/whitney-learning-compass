# Stage 2 validation receipt

**Executed:** October 21, 2026 (America/New_York).  
**Scope:** Verified local catalog and deterministic matching only. Stage 3 has not begun. This receipt supplements, and does not rewrite, the original Stage 1 receipt.

## Catalog and source review

The catalog contains **20 real programs: the original five plus all 15 planned candidates**. No substitutions were necessary. Full official HTML detail pages were opened and reviewed; source access was not inferred from search snippets. The [research ledger](catalog_research.md) contains all 15 added programs, official URLs, published grades, fees, durations, verification status and specific limitations. All 20 reviewed URLs also appear in [catalog_audit.json](../artifacts/catalog_audit.json).

The new records preserve original grade labels and subjects, concise factual summaries, per-student fees, published duration where present, source IDs, field-level evidence, verification dates and explicit unknowns. Source review date is 2026-10-21; an unknown museum update date remains null.

The original five complete program objects are preserved, including IDs, descriptions, normalization, evidence, verification history and missing-value records. Their official pages were rechecked; no factual correction was warranted. The independent original pilot fingerprints in [pilot_sha256.json](../tests/fixtures/pilot_sha256.json) are checked by both the audit and tests. The approved PRD and Stage 1 receipt remain unchanged.

## Catalog integrity and completeness

The executed loader/audit passed:

- 20 unique stable IDs and 20 unique canonical official URLs.
- Required fields, types, finite amounts, per-student basis, duration units and grade normalization.
- Source IDs, source URL/program consistency and all **280 field-evidence entries**.
- Exact null-field inventory, with reason and next verification action for each unknown.
- Preservation checks for all five pilot programs.
- Separate published subjects and evidence-supported editorial themes.

There are **144 null field occurrences** across records; this counts fields, not programs or independent research questions.

| Field | Records with null |
| --- | ---: |
| Explicit ISO currency code | 20 |
| Program-specific published standards | 20 |
| Group-size minimum | 20 |
| Group-size maximum | 20 |
| Accessibility notes | 20 |
| Booking availability | 20 |
| Museum source-update date | 20 |
| Duration in minutes | 2 |
| Original duration text | 2 |

All 20 have reviewed names, URLs, grade labels, subject labels, summaries and per-student prices. Eighteen have published duration; **Bridges and Rubber Band Car** do not.

Important evidence limitations:

- Tangrams' live Grade Level links include K, 1–6 and 7+. The earlier extraction discrepancy remains documented; the pilot was not rewritten.
- Whitney Relay's resource headings mention Grades 3–5 and 6–8, but current Grade Level metadata is 4, 5, 6, 7+. Resource headings do not expand eligibility.
- Linked Whitney Relay and Electromagnet program-information PDFs could not be read reliably. Retrieval failures and the attempted alternate browser access are recorded in the research ledger. Standards remain unverified, not invented or asserted absent from unread documents.
- Resourceful Schools publishes 2.00 hours and $18/student while recommending two sessions. The record preserves 120 minutes and $18; whether these cover both sessions requires confirmation. No multiplier is inferred.
- Prices preserve the original $ symbol. All ISO codes remain null. USD interpretation is an opt-in, disclosed application assumption.
- Availability, accommodations, group limits, delivery conditions and additional costs are not established by this catalog. A reviewed public page is not a booking confirmation or binding quote.

Catalog SHA-256 at validation: `3a686069bf7e151b3defc5474b5be96932dd3247df1755999ccb66086d99cda6`.

## Grade × Theme checkpoint

Actual verified grade coverage with separately documented editorial relevance:

| Grade | Engineering | Sustainability and Energy | Science | Interdisciplinary Learning |
| --- | ---: | ---: | ---: | ---: |
| 2 | 2 | 2 | 3 | 4 |
| 3 | 6 | 3 | 10 | 6 |
| 4 | 10 | 5 | 15 | 7 |
| 5 | 9 | 3 | 15 | 6 |
| 6 | 8 | 3 | 14 | 6 |
| 7 | 8 | 3 | 12 | 4 |

[Coverage report](catalog_coverage.md) lists contributing IDs and a source/rationale ledger. [coverage.json](../data/coverage.json) supplies per-cell grade and theme evidence. Each cell counts distinct IDs; overlapping themes mean cell totals are not unique catalog totals. Zero uncertain assignments were included; the schema supports separating uncertainty from confirmed editorial assignments.

Grade 2 has the narrowest selection, particularly Engineering and Sustainability and Energy with two programs each. Grade 3 has three sustainability/energy choices. No cell is empty. These are coverage observations, not validated thresholds for educational adequacy, booking availability or eligibility under other constraints.

## Matching implementation and reproduction

Runtime uses only the Python standard library. Python 3.14 and pytest 9.1.1 were used for this validation; README specifies Python 3.11 or later and pinned development dependencies.

- `matching/catalog.py`: local JSON loading, schema/evidence validation, source and unknown-field checks.
- `matching/grades.py`: explicit grade normalization, published 7+ handling and mixed-grade support.
- `matching/engine.py`: validated requests, hard checks, exact decimal fee calculations, transparent keyword preferences and separate operational status.
- `matching/coverage.py`: evidence-linked editorial coverage.
- `matching/audit.py`: reproducible audit, coverage and actual deterministic examples.

Public functions are `load_catalog()`, `validate_catalog()`, `validate_requirements()`, `match_program()` and `match_catalog()`. The [matching rules](matching_rules.md) document inputs, outputs and future read-only agent boundaries. The [README](../README.md) provides a runnable request example.

Requests specify grade(s), optional student count/budget/currency assumption/duration/preferences and explicit mandatory operational requirements. Budget calculations require a student count. Results retain individual checks, evidence, reasons, exact monetary subtotal strings, assumptions, topic matches and confirmation items. Stored `id` is exposed as `program_id`, preserving the existing schema.

Hard status precedence is **fail > unknown > pass**. Missing fields affect eligibility only when an applicable requirement needs them. Every requested grade must be supported. A published 7+ label supports Grade 7 without asserting an upper museum limit. Input grades are bounded to PreK–12 as a utility validation rule; the initial product audience remains Grades 2–7.

Operational unknowns remain separate unless mandatory. No result claims a confirmed booking. Soft topic scores cannot override hard constraints. All real catalog results are returned, without inventing or padding a three-program shortlist.

## Actual matching demonstrations

These examples were executed by `python -m matching.audit`; full inputs, individual checks, official URLs and evidence are saved in [matching_demonstrations.json](../artifacts/matching_demonstrations.json).

Unless overridden below, requests are Grade 4, 24 students, $400 program-fee budget with explicit USD assumption, and a 90-minute maximum.

| Actual case | Result | Reason |
| --- | --- | --- |
| Catapult | pass; conditional currency classification | Published Grade 4, $14/student and 90 minutes; 24 × 14 = $336 within $400. Capacity and booking still unconfirmed. |
| Wind Power, budget $350 | fail | 24 × $15 = $360 exceeds $350. |
| Bridges | unknown | Grade and $336 subtotal pass; required duration cannot be verified. |
| Catapult, mandatory verified capacity | unknown | Published grade/fee/time pass, but capacity for 24 is unverified. |
| Bridges, Grade 2 | fail | Unsupported grade takes precedence over unknown duration. |

These are actual deterministic executions, not agent/model demonstrations, user studies or observed educational impact.

## Executed automated tests

Command, run from the project root:

```sh
.venv/bin/python -m pytest -q -p no:cacheprovider --basetemp=.test-tmp --junitxml=artifacts/pytest.xml
```

**124 passed in 0.29 seconds; zero failures, errors or skips.** See [captured output](../artifacts/pytest.txt) and [JUnit XML](../artifacts/pytest.xml). The final suite was executed after the implementation and test refinements; subsequent changes were documentation only.

Tests exercise real catalog loading and matching, not file-existence checks. Coverage includes invalid JSON/schema/evidence/null inventories, unique IDs/URLs, original pilot fingerprints, K/Grade 2/7+/mixed grades, exact fee boundaries, overruns, missing prices, unsupported currencies, disclosed assumptions, missing/excessive durations, fail precedence, no qualifying programs, operational requirements, topic preferences, malformed/adversarial inputs and all five actual pilots. Synthetic unknown/capacity fixtures are explicitly test-only copies and never enter the catalog.

The local audit and coverage generation also executed successfully:

```sh
.venv/bin/python -m matching.audit
```

Compilation of matching and test modules was checked successfully. Documentation checks inspect heading uniqueness, balanced fences, Markdown table column consistency, local link targets and suspicious escaping; they do not claim a browser visual render or re-verification of external websites by the Markdown checker.

Final documentation check: nine Markdown files and 43 local link targets checked; no duplicate headings, unbalanced fences, inconsistent table columns, broken local links or suspicious escaping found. JUnit XML independently confirms 124 tests with zero failures/errors/skips, and the saved audit's catalog SHA-256 matches the current file.

## Files and boundary controls

Modified:

- `data/programs.json`: 15 appended records and Stage 2 catalog metadata; original five objects unchanged.
- `docs/data_dictionary.md`: current catalog envelope and backward-compatible Stage 2 clarification.
- `docs/catalog_expansion_plan.md`: dated completion status, preserving the original backlog and editorial categories.

Created:

- `README.md`, `.gitignore`, `requirements-dev.txt`, `pytest.ini`.
- `matching/__init__.py`, `matching/catalog.py`, `matching/grades.py`, `matching/engine.py`, `matching/coverage.py`, `matching/audit.py`.
- `tests/conftest.py`, `tests/test_catalog.py`, `tests/test_matching.py`, `tests/test_coverage.py`, `tests/fixtures/pilot_sha256.json`.
- `data/program_themes.json`, `data/coverage.json`.
- `docs/catalog_research.md`, `docs/catalog_coverage.md`, `docs/matching_rules.md`, `docs/stage2_validation.md`.
- `artifacts/catalog_audit.json`, `artifacts/matching_demonstrations.json`, `artifacts/pytest.txt`, `artifacts/pytest.xml`.

The local ignored `.venv/`, Python bytecode and test temporary files are development artifacts inside this project. They are not runtime infrastructure or intended Git deliverables.

The project scope and original Stage 1 validation receipt remain unchanged. `proof-joke.txt` is absent and was not recreated. Workspace files outside this project were checked using a before/after inventory of relative path, size, nanosecond modification time and mode; this is a metadata boundary check, not a content hash of every external file. All edits and generated project artifacts are confined to this project.

Boundary result: the before/after inventory matched for 195,878 outside-project files, with metadata SHA-256 `e745309829d9bc4f36bd42f5b805e98dd705f81b2bd62071d1ad55ba83fd3ce2`. Final checks also reconfirmed the original pilot objects, PRD and Stage 1 receipt against the starting contents.

## Remaining limitations and next-stage gate

- Resolve missing durations and delivery ambiguities before relying on those details for affected requests; inspect unread official PDFs before claiming standards alignment.
- Reconfirm operational requirements directly with the museum. No source refresh or booking automation is implemented.
- The lexical preference baseline can miss synonyms and is not an educational-quality assessment. Editorial themes remain curator interpretations.
- Small lower-grade theme selections should remain visible. Current coverage does not justify expanding published eligibility.
- These tests validate deterministic behavior and catalog structure; they do not establish real-user value, model safety or measured Tokenomics. Those future evaluations remain planned in the PRD.
- No project model-provider inference calls, Portkey calls, agents, PydanticAI orchestration, FastAPI, frontend, external database, runtime scraper, payments, messages, report.html or slides.html were created or executed.

**Stop point:** Stage 2 is ready for user review. Stage 3 requires separate authorization.

