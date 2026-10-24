# Stage 5D submission manifest

Prepared October 24, 2026. This is an explicit recommendation for a later authorized Git checkpoint/publication, not a staging script or a claim of fresh-clone verification. No files were staged, committed, pushed, deleted, or regenerated in Stage 5D-2.

## 1. Exact recommended tracking set

Preserve the **396 files already tracked at commit `50a96b23141fedb08052ef05d304db5f41d91da6`**, with only the authorized README and ignore-rule updates, and add the **16 named files in Section 4**. The resulting recommended set is **412 files**. This fixed-commit definition avoids inadvertently admitting other untracked files or future working-directory contents.

The exact existing 396 paths can be listed without changing Git:

~~~sh
git ls-tree -r --name-only 50a96b23141fedb08052ef05d304db5f41d91da6
~~~

Do not use `git add .`, a recursive add of `artifacts/stage5c/`, or an upload of the entire working folder. The existing tracked history includes legitimate earlier QA receipts and images; this recommendation does not delete or untrack them retrospectively. New superseded copies and redundant renders are excluded from the recommended additions.

## 2. Required application and final deliverables

Retain the existing tracked files in the following groups, not arbitrary new files under those directories:

| Group | Required contents and role |
| --- | --- |
| Root setup | `README.md`, `.gitignore`, `.env.example`, `requirements.txt`, `requirements-dev.txt`, `requirements.lock`, `pytest.ini` |
| Backend | Nine tracked files under `backend/`: FastAPI entry point, typed models, two PydanticAI agents, configuration/gateway, orchestration and independent safety/output validation |
| Matching/catalog | Six tracked files under `matching/`; `data/programs.json`, `data/program_themes.json`, `data/coverage.json` |
| Frontend | Tracked React/TypeScript/CSS source, `frontend/index.html`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, test fixtures and scripts |
| Tests/evaluation | All tracked files under `tests/`, `evaluation/` and `scripts/`; preserve genuine failure/repair evidence and offline fixtures they consume |
| Documentation/evidence | Existing tracked `docs/` and `artifacts/` files, plus the explicit additions below |
| Frozen final documents | [report.html](../report.html), [slides.html](../slides.html), [report-print.pdf](../artifacts/stage5c/report-print.pdf), [slides-overview.pdf](../artifacts/stage5c/slides-overview.pdf) |

The report PDF is 13 US Letter pages. The slide overview is retained in the recommended GitHub submission as a 10-page widescreen static review copy. It supplements the required interactive HTML deck.

## 3. Dependency and evidence inspection

The application uses repository-relative code/catalog paths; it does not require Stage 5C authoring tools or local browser profiles. Python dependencies are pinned in `requirements.lock`; frontend dependencies are pinned in `frontend/package-lock.json`. The historical environment and caches are not dependencies to distribute.

Keep the following actual fixture/evidence dependencies; they are already in the fixed tracked set:

- Frontend fixtures import `artifacts/agent_runs/case-a-advisor.json`, `case-a-journey.json`, `case-b-advisor.json`, and `case-c-validated.json`.
- Frontend component/draft tests import `artifacts/stage4_1/offline-fixtures.json`; the historical draft browser script also uses `artifacts/stage4_4/replacement-fixture.json`.
- Pilot-preservation tests read `tests/fixtures/pilot_sha256.json` and the real catalog. Reliability tests read the preserved `artifacts/stage5/A01-full-advisor.json`, `A01-full-designer.json`, and other named Advisor outputs.
- The separate evaluation harness reads `artifacts/stage5/evaluation_scenarios.json`. The evaluation modules, results, usage/cost records, quality review, and Stage 5B.1 replay receipts substantiate the quantitative and safety findings.
- `artifacts/stage4/browser-live.json` and its genuine recommendations, selection, journey and review images support the documented two-agent workflow. The eight additional crops below are traceable to those originals through the image-provenance record.
- `docs/report_evidence_map.md`, `docs/tokenomics_analysis.md`, `docs/safety_evaluation.md`, and `docs/impact_study_results.md` explain the evidence and its limits. P01 remains a one-person proxy-user study; quote permission is unestablished and only paraphrased feedback should be used. Do not add raw participant material without a separate privacy/permission review.

Both final HTML files embed all eight screenshot crops and their custom diagrams/styles. They have no runtime dependency on local image files, authoring scripts, or the `vendor/` directory. The report opens independently without network assets; the deck loads only reveal.js 5.2.1 CSS/JavaScript from jsDelivr. The preserved crops/provenance are included for auditability, not to make the HTML render.

## 4. Explicit additions recommended for final Git tracking

This is the complete addition list, not a wildcard pattern:

~~~text
docs/stage5d-submission-manifest.md
report.html
slides.html
artifacts/stage5c/report-print.pdf
artifacts/stage5c/slides-overview.pdf
artifacts/stage5c/revision-pages2-6/image-provenance.json
artifacts/stage5c/revision-pages2-6/trace-verification.json
artifacts/stage5c/revision-pages2-6/images/advisor-facts.png
artifacts/stage5c/revision-pages2-6/images/advisor-reasoning.png
artifacts/stage5c/revision-pages2-6/images/selected-catapult.png
artifacts/stage5c/revision-pages2-6/images/selection-action.png
artifacts/stage5c/revision-pages2-6/images/before-preparation.png
artifacts/stage5c/revision-pages2-6/images/during-evidence.png
artifacts/stage5c/revision-pages2-6/images/after-assessment.png
artifacts/stage5c/revision-pages2-6/images/teacher-review.png
artifacts/stage5c/revision-tokenomics-safety/evidence-provenance.json
~~~

The three provenance JSON files document original image sources/crops, the genuine tool sequence and teacher selection, and the actual usage/offline defense records behind the report illustrations. Their source dependencies are already tracked. They are preserved evidence summaries, not new experiments or updated model outputs.

Only `README.md` and `.gitignore` are modified tracked files in this preparation step. The new manifest is included above. The other 15 additions are unchanged pre-existing final/evidence files. At this step's inventory, **242 other untracked Stage 5C files remain outside the recommended tracking set**; their exclusion is documentary, not a deletion or broad ignore rule.

## 5. Not intended for submission

| Category | Handling |
| --- | --- |
| Real `.env` files, credentials, workflow capabilities, private runtime traces | Keep local and ignored; never stage, include in a ZIP, or supply as teaching-staff credentials. `.env.example` alone is a safe template. |
| `.venv/`, `frontend/node_modules/`, generated `dist/`, Python/test caches, logs and `.runtime/` | Install or generate locally; do not distribute. Existing ignore protections remain. |
| `artifacts/stage5c/.qa-browser-profile/` | Explicitly ignored in this step; browser state is not evidence to publish. |
| Stage 5C `report-before.html`, `report-before.pdf`, `build-before.py`, repeated `pdf-pages/`, `pdf-bottoms/`, screenshots, baselines and old QA receipts | Preserve locally as historical editorial working material; do not add by default. Existing historical receipts must not be represented as final-deck QA. |
| Stage 5C `build.py`, `qa.mjs`, `verify.py`, `responsive.mjs`, `contact.mjs`, Swift render/crop helpers, and revision-specific authoring/QA scripts | Historical/non-authoritative tooling; not required for the app or frozen HTML/PDF delivery. Do not add or run as a final build pipeline. |
| Stage 5C `vendor/`, full website/assignment snapshots, old content manifests and unused images | Not required by the frozen HTML files or selected provenance dependencies. Retain locally, outside the recommended additions. |

Do not delete these files or rewrite their original receipts. A future need for an excluded item should be reviewed individually. Retaining an item locally does not make it part of the submission. Existing Git tracking/ignore rules do not replace a later explicit staging and security review.

## 6. Frozen-artifact protection

The four final files below are authoritative. **Do not regenerate them with historical `artifacts/stage5c/build.py`, even with `--report-only`, or earlier QA scripts.** The builder contains superseded Page 12 prefixes and an older slide implementation; older QA scripts also expect a different deck structure and can overwrite outputs. This preparation changes neither these scripts nor the frozen deliverables.

SHA-256 baselines recorded before Stage 5D-2 edits:

| File | SHA-256 |
| --- | --- |
| `report.html` | `f1ce2cd6e962c1bdb7be4be54e3b9ae16e5ccf0549a7416d505b1b115bc4150c` |
| `slides.html` | `53897a248066db78db0dae8eacbe16de797673480324b0c5ad8aab8511087b1c` |
| `artifacts/stage5c/report-print.pdf` | `c89d7904110598ef7eaa89f919e8dbe5f6e73e9b5d7c851662655206a6a11179` |
| `artifacts/stage5c/slides-overview.pdf` | `7e44e9ef3d2301f6eb8d100f652ff7b758c0a127c49b9ac91ee3a843c990c378` |

The report cover's repository-URL placeholder is deliberately unchanged. After the real URL is established, a separately approved targeted update must preserve all other report content and pagination; it must not invoke the obsolete whole-deck generator.

## 7. Remaining submission dependencies and stop point

- Establish the actual GitHub repository URL, visibility and teaching-staff access; no remote is configured by this step.
- Arrange the grader's own authorized Portkey/course-model credentials. Never publish the author's key or assume access is automatic.
- Approve the selected additions and later security/staging review, including any decision to publish beyond teaching staff.
- Resolve the report-cover placeholder only after the URL exists and the targeted change is authorized.
- Perform a separately authorized fresh-clone installation/runability check. The README's approximate ten-minute setup is a target with prerequisites, not an observed result.

No application logic, catalog, prompts, test expectations, historical traces, Tokenomics data, P01 evidence, final report, or final slide content is changed by this manifest. No model calls, fresh-clone test, commit, remote configuration, push or deployment is part of Stage 5D-2.
