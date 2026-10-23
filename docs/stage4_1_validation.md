# Stage 4.1 — Teacher-Facing UX and Evidence Polish

Completed 2026-10-23. This receipt records a presentation refinement after Stage 4, not Stage 5. Historical validation receipts and execution artifacts are unchanged.

## Findings and changes

| Area | Stage 4 finding | Stage 4.1 behavior |
| --- | --- | --- |
| Optional limits | `400` and `90` were placeholders. Actual initial state was `null`, and the request correctly sent no limits when the examples were untouched. No matching-engine defect was found. | Examples explicitly read `e.g., 400` and `e.g., 90`; associated help explains leaving each blank. Entered/current values are submitted. Discovery and journey use a shared summary of the submitted request. |
| Evidence | Source views displayed field paths, source IDs and machine statuses; full-catalog checks exposed internal constraint names. | Human-readable source summaries, requirement explanations and next steps; official links and review dates remain accessible. Underlying evidence and validation statuses are unchanged. |
| Catalog checks | A long expanded list repeated every technical check. | “How were programs checked?” is collapsed by default. Three expandable groups show counts; each initially lists up to five concise decisions, with Show All and per-program explanations. All 20 results and their official links remain available. |
| Navigation | The source already used the five approved English step labels. A scan found no Chinese characters in TypeScript/TSX source. | English labels preserved and regression-tested. The reported mixed-language display was likely browser translation; this cannot be established from source inspection alone. No localization infrastructure added. |
| Print | A separate print block repeated raw evidence pointers and all verification notes, including safety and review-date text. | Shared human-readable source content; operational questions, safety and source information have separate sections. Printable official URLs are semantic hyperlinks. |
| Attribution | Stage 4 already compared edited content with the original; no unconditional “teacher-edited” bug was found. Review status replaced the original authorship label. | “AI-Generated Teaching Suggestions” remains until an actual suggestion changes. “Teacher-Edited Teaching Suggestions” reflects edits; “Reviewed by Teacher” is a separate acknowledgment. Editing clears acknowledgment; reverting restores the original attribution. |
| Readability | Several supporting labels and evidence paragraphs were small. | Modest increases to screen evidence, help, supporting text and editable suggestion typography; colors, main typography, design and workflow preserved. |

Unknown duration remains prominently “Not published” even when no time limit applies. A visible note and museum question distinguish missing facts from eligibility and bookability. No rule or status is calculated anew in TypeScript.

Source summaries require a non-null fact, supporting field evidence in an accepted status, and a resolving source ID. A more specific evidence pointer takes precedence over a parent pointer. Missing/conflicting evidence is not promoted to a verified source field. Factual summaries remain distinct from AI educational interpretation. Source-retrieval technical notes are translated into relevant limitations without changing the catalog.

## Input and deterministic regression scenarios

`frontend/scripts/stage4-1-fixtures.py` validates inputs through the real `TeacherRequest`, calls the existing `load_catalog` and `match_catalog`, and constructs authoritative facts with the existing backend `facts` function. It never invokes an agent. Candidate selection in these fixtures is a deliberate UI test arrangement, not a new agent ranking. The Catapult teaching plan is replayed from the saved Stage 4 response, with fixture workflow identifiers.

| Scenario | Request checked | Actual matching / presentation result |
| --- | --- | --- |
| A: entered limits | Grade 4; 24 students; budget 400; currency USD; assumption acknowledged; duration 90 | Catapult passes and subtotal is **USD 336.00**. Rubber Band Car and Bridges have unpublished duration and remain `unknown` / Needs Confirmation. Catalog groups: 14 meet applicable requirements, 2 need confirmation, 4 do not meet requirements. |
| B: blank optional limits | Budget, currency and duration `null`; USD assumption false | No sample values inserted. Summary explicitly states no maximum budget or duration specified. Rubber Band Car and Bridges meet applicable grade requirements while still displaying unpublished duration and confirmation questions. No unsupported currency subtotal is invented. |
| C: edited limits | Initial 400/90 changed to 600/120 before submission | Request and summary use **600/120**, not the earlier values. Missing-duration programs still require confirmation. |

Component tests also cover clearing previously entered values, source integrity, failed/unknown explanations, three-state presentation, editing/reverting/review acknowledgment, English navigation, and print separation. Browser interception checks the actual serialized POST payload against each validated fixture request. Requests are recorded in `artifacts/stage4_1/browser-regression.json` without capability headers.

## Actual validation results

| Check | Final result |
| --- | --- |
| Existing Python regression suite | **222 passed, 0 failed** |
| Frontend suite | **75 passed, 0 failed** (57 existing plus 18 targeted cases) |
| TypeScript | Passed |
| Vite production build | Passed |
| Browser assertions | **50 passed**, no browser JavaScript errors |
| Automated accessibility | Four screen audits, **0 violations**; this is not a complete accessibility certification |
| PDF checks | Two five-page exports; actual hyperlink annotations to the official Catapult URL; correct attribution/review states; no raw evidence pointers; one source-review note and one museum safety statement each |
| Preservation | Hash checks confirm protected catalog, matching, backend, Python tests, historical artifacts/docs and README unchanged |

The initial frontend check found an ambiguous test query after headings became repeated in collapsed catalog groups and repeated standards wording in the source view. Queries were scoped to recommendation cards and redundant standards wording removed; the final suite passes. During print inspection, repeating operational unknowns in Sources pushed the disclaimer onto an otherwise empty sixth page. Those questions now appear in their dedicated section, and the disclaimer stays together. Final output is five pages without changing phase page breaks or shrinking body text to impose a page count.

## Browser and PDF evidence

Chrome used the actual local React application at `http://127.0.0.1:5173`. Health and 20-program catalog requests passed through the Vite proxy to the actual backend on port 8008. **Recommendation and journey POST responses were intercepted and replayed offline. These are not new live Portkey runs.** The browser script permits only those two POST routes and passes through only health/catalog GET requests.

Covered entered, blank and edited limits; three-way comparison; expanded evidence; all 20 catalog decisions; explicit selection; a complete Catapult journey; editing and teacher review; inquiry editing; desktop/mobile rendering; print control exclusion; and in-memory capability handling. Navigation, editing and printing generated no extra POSTs. The replay made three recommendation requests and one journey request, all local fixtures. Four accessibility audits covered desktop intake, desktop/mobile review, and mobile missing-duration selection. Mobile viewport was 390 × 844; desktop was 1440 × 1050.

Updated genuine screenshots are under `artifacts/stage4_1/`: intake-applied/blank, recommendations-provided/blank/edited, comparison, source-evidence, catalog-summary/expanded, journey-untouched, review-desktop/mobile, and mobile-missing-duration. Fixture labels in these screenshots deliberately identify test options rather than implying new AI reasoning.

`plan-untouched.pdf` and `plan-reviewed.pdf` are Chrome print exports of the replayed historical plan. `pdf-checks.json` records page counts, text checks and PDF `/Link` annotations with the official `/URI`; displaying URL text alone was not treated as proof. Both links on page 5 target `https://www.eliwhitney.org/catapult`. `pypdf` inspected text and annotations; macOS PDFKit rendered the reviewed PDF to `print-page-1.png` through `print-page-5.png`. All five rendered pages were visually inspected for clipping, overlap, source readability and section separation. Browser print behavior may differ by engine, paper size, margins and teacher edits; five pages is an observed example, not a guarantee.

## Files changed

Modified existing files:

- `frontend/src/components/Intake.tsx`
- `frontend/src/components/ProgramDetails.tsx`
- `frontend/src/components/LearningPlan.tsx`
- `frontend/src/presentation.ts`
- `frontend/src/App.tsx`
- `frontend/src/styles.css`
- `frontend/src/App.test.tsx`

Added:

- `frontend/src/evidence.ts` — display-only evidence and constraint formatting.
- `frontend/src/components/CatalogChecks.tsx` — grouped progressive disclosure.
- `frontend/src/stage4_1.test.tsx` — targeted regressions.
- `frontend/scripts/stage4-1-fixtures.py` — reproducible actual-matcher offline fixtures.
- `frontend/scripts/browser-stage4-1.mjs` — offline browser walkthrough.
- `docs/stage4_1_validation.md` — this receipt.
- `artifacts/stage4_1/` — fixtures, actual test/build logs, browser requests/checks, screenshots, PDFs, page renders and integrity evidence. `file_manifest.json` lists individual delivered paths and hashes.

README and dependency files were not changed; setup remains the same. No dependency was added. Local validation caches and PDF rendering scratch work remain ignored under `.runtime/`.

## Reproduce

From the project root, run `.venv/bin/python -m pytest -q` and `.venv/bin/python frontend/scripts/stage4-1-fixtures.py`. From `frontend/`, run `npm test`, `npm run typecheck`, and `npm run build`.

For offline browser replay, start the existing backend (`.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --no-access-log`) and Vite (`npm run dev --prefix frontend`) in separate project-root terminals. Then run `node scripts/browser-stage4-1.mjs` from `frontend/`, with local Google Chrome installed. This regenerates only Stage 4.1 browser artifacts; it does not invoke the model. Ordinary manual use of Discover Programs or Generate Learning Journey still invokes the existing real backend workflow.

## Boundaries and limitations

No real model calls were needed or performed; no new token-usage or cost measurements are claimed. Historical teaching content was replayed, not regenerated. This stage does not retest provider availability or constitute measured teacher impact evidence. Eligibility, missing values, currency assumptions and booking uncertainty remain governed by the unchanged Stage 2/3 backend.

Only project-local frontend, regression and Stage 4.1 evidence files changed. The 20-program catalog, all original pilot records, matching engine, agent orchestration, backend contracts, existing Python tests, Stage 1–4 historical receipts/evidence and Git checkpoint are preserved. Workspace metadata was compared before/after; no unrelated workspace files changed. No credentials were added to the delivered files; test capabilities are inert offline placeholders. No Git commit, remote or push was made. No Stage 5 report, slides, evaluation study or other Stage 5 work was started.
