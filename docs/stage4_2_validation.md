# Stage 4.2 validation — visual design, mobile UX and Quick Start

Completed October 23, 2026. This is a presentation refinement of approved Stage 4.1. No backend, catalog, matching, agent or provider configuration changed. Earlier validation receipts and artifacts remain historical records.

## Museum visual audit and palette

Chrome directly inspected the [homepage](https://www.eliwhitney.org/), [school catalog](https://www.eliwhitney.org/workshop/school-programs) and [Catapult](https://www.eliwhitney.org/catapult). The one-time research script reads `getComputedStyle()`, matching CSSOM declarations, ancestor surfaces and real hover states. [Museum visual reference](museum_visual_reference.md) contains selectors, RGB values, HEX conversions, dates, stylesheet traces and limitations; [raw readings](../artifacts/stage4_2/museum-computed-styles.json) retain the evidence.

Verified observations include header `#F5F5F5`, navigation/filter surface `#A8B5BA`, booking button/title links `#952F2B`, hovered booking button/title surface/Grade 4 badge `#789A5B`, program cards `#EEF3F5`, and homepage event surface `#D6AC6F`. Grade 2 uses `#5E9DD1` and kindergarten `#9E81BA`; these were not adopted. The title surface is solid, not a gradient. Its neighboring photo banner has a background image; no single HEX describes it. Transparent links/body are explicitly distinguished from their ancestor surfaces. Two cross-origin stylesheets could not be read through CSSOM, but their computed styles were accessible. These are observed website colors, not an official brand guide.

| Application role | Stage 4.1 → Stage 4.2 |
| --- | --- |
| Core identity | Keep headings `#213D36`, text `#263D38`, page `#F6F5EF`, paper `#FFFEF9`, original compass and serif headings |
| Primary action | `#244F3F` → existing deep-teal token `#214F44` |
| Museum accents | Add brick `#952F2B`, olive `#789A5B`, blue-gray `#A8B5BA` to restrained rules/example accents |
| Workshop illustration gold | `#B98538` → museum-observed `#D6AC6F`; no asset replacement |
| Cool surfaces | Introduce `#EEF3F5` for example feedback, mobile comparison and After |
| Phase headers | Before retains `#EFF3E8`; During `#F6F0E2` → app-created tint `#F7EFDF`; After uses cool surface |
| Controls and focus | Stronger control border `#708077`; brick `#952F2B` focus ring replaces the previous pale/ochre focus treatments |
| Eligibility | Preserve labeled green `#285637` / `#E5EEE0`, amber `#74551D` / `#F6E9C6`, red `#8A3F30` / `#F5E4DD` |

CSS custom properties centralize the new roles. The museum's white-on-olive pairing is not copied for application text. No museum photograph, logo, font, external asset or endorsement is introduced. The independent-prototype disclaimer remains visible and printable.

## Mobile usability and hierarchy

The desktop sidebar remains. Phones show the current step, Step X of 5, a progress bar and a Show steps control opening the existing navigation. Later steps remain disabled until the established workflow allows them. Restart remains available through navigation. No fixed action bar obscures inputs.

Budget/duration stack on phones; student count becomes full width. Grade chips and measured button/summary controls are at least 44 CSS pixels high, with primary phone actions at least 48 pixels. Number fields expose numeric/decimal input modes. Mobile inputs and learning-plan editors use 16px text. Program descriptions and key facts use 15px; supporting information mostly uses 14px, with desktop sidebar support at 13px. Typography was adjusted selectively, not globally scaled.

Mobile comparison presents each attribute followed by the compared programs' values, using the same authoritative response fields as the desktop table. It does not compress three columns or recompute eligibility. Selection remains explicit and precedes a separate generation action. The single-column journey keeps auto-growing editors and preserves edits when moving to review and back.

Program cards immediately display grades, fee, subtotal, duration, eligibility, educational explanation, official link and booking uncertainty. Subject lists, safety detail and Additional Source Details use progressive disclosure. Source dates, evidence, field completeness and lower-priority unknown metadata remain accessible. Currency assumptions stay visible with subtotals. Mandatory unknown checks remain outside collapsed evidence; Bridges and Rubber Band Car still show unpublished duration and Needs Confirmation under a 90-minute limit. Program-specific delivery notes remain prominent. The frontend does not independently classify eligibility or claim bookability.

## Quick Start behavior

| Editable example | Grade / students | Fee budget / maximum time | Topics |
| --- | --- | --- | --- |
| Explore Force & Motion | 4 / 24 | 400 / 90 minutes | Force and motion, engineering design, experimentation |
| Discover Sustainable Energy | 5 / 20 | 350 / 90 minutes | Renewable energy, sustainability, engineering |
| Geometry Through Creative Design | 2 / 22 | 350 / 90 minutes | Geometry, shapes, creative design |

The exact requested goals are stored in `examples.ts`. Clicking loads actual editable state and announces what changed. It never submits, requests a model, chooses a museum program or promises a match. Applying or switching examples always leaves USD acknowledgment unchecked, even if a previous example was acknowledged. Existing advanced standards/operational requirements are preserved. Clear example restores the ordinary Grade 4 / 24-student defaults, clears the goal/topics and optional limits, resets acknowledgment, and preserves advanced requirements; its status message explains this. Manually edited or blank values are used on submission. Stale intake error messages now clear on field edits; normal submit validation remains authoritative.

## Executed validation

| Check | Actual result |
| --- | --- |
| Complete Python suite | **222 passed, 0 failed**, 2.54 seconds |
| Frontend suite | **91 passed, 0 failed** across six files; all 75 prior tests plus 16 new cases |
| TypeScript | Passed |
| Production build | Passed, 37 transformed modules |
| Browser assertions | **314 passed**; no uncaught application JavaScript errors |
| Responsive layout inspections | **36** screen/viewport checks; no horizontal page overflow or overlapping entry fields |
| Axe scans | **24**, zero detected violations |
| PDF | Five pages; two actual official-URL link annotations; all phases, edits and review retained |

Text/XML logs and browser JSON are under [artifacts/stage4_2](../artifacts/stage4_2/). Tests cover preset values, switching, clearing, edited submissions, mixed grades, empty optional constraints, no automatic inference/consent, preservation of advanced requirements, keyboard activation, navigation gating, mandatory uncertainty and mobile comparison selection. Existing API, eligibility, error, editing and print tests still pass unchanged.

The browser uses real Chrome at widths **320, 360, 390, 430, 768 and 1440**. Each viewport completes intake → recommendations → comparison → selection → journey → edited review. Health/catalog requests reach the actual local backend through Vite. All recommendation/journey POSTs are intercepted using saved sanitized Stage 4.1 fixtures: 12 successful replay requests, plus a separate controlled provider-error response. The fixture recommendation explanations identify their offline-test purpose. These are **not new live model results**.

Browser checks inspect current request payloads, the unchecked USD gate, duplicate-submission prevention, explicit teacher selection, all three journey phases, persistent edits, source visibility, missing-duration warnings, keyboard focus, reduced motion, input sizes, and absence of capabilities in DOM/URLs/localStorage/sessionStorage. The application network-origin record contains only the local frontend origin. The first script attempt failed because its assertion looked for the pre-loading button name after the button changed to its loading label; the locator/timing was corrected. That failed test attempt is retained separately rather than presented as an application or provider failure.

### Contrast and accessibility limits

Actual computed foreground/background pairs, compositing transparent ancestors, yielded these ratios:

| Sample | Contrast |
| --- | --- |
| Body / supporting text / small label | 10.64 / 5.48 / 4.70 |
| Primary button / link / input text | 9.16 / 6.03 / 11.88 |
| Input border / example control boundary / focus ring | 4.13 / 4.12 / 7.65 |
| Disabled step | 4.87 |
| Pass / unknown / fail badge text | 7.12 / 5.68 / 6.01 |

All sampled text exceeds 4.5:1 and sampled meaningful boundaries/focus exceed 3:1. Status swatches were temporary test elements using the actual CSS, not fabricated program results. Keyboard focus has a visible 3px outline; native buttons, labels and status announcements remain in use. Checkbox target measurements use their associated clickable labels. Inline source links are not all 44px targets. Decorative accents are not treated as status information.

Zero axe violations is not a full WCAG claim: incomplete scan items include color-contrast and one desktop comparison ARIA review item. Sampled contrast and semantics were reviewed, but exhaustive screen-reader testing was not performed. Desktop Chrome viewport testing does not establish physical-phone keyboard behavior, iOS Safari behavior or VoiceOver usability. No sticky controls cover editors, but an actual-device keyboard review remains useful.

## Visual and print evidence

- Matched-state desktop: [before](../artifacts/stage4_2/before-desktop.png) / [after](../artifacts/stage4_2/after-desktop.png). Both use the original goal-only example with empty optional limits.
- Mobile: [intake](../artifacts/stage4_2/intake-390-viewport.png), [recommendations](../artifacts/stage4_2/recommendations-390.png), [comparison fees/duration](../artifacts/stage4_2/comparison-fees-390.png), [selection](../artifacts/stage4_2/selection-390.png), [journey editing](../artifacts/stage4_2/editing-390.png), [review](../artifacts/stage4_2/review-390.png), [controlled error](../artifacts/stage4_2/error-390.png).
- Additional full renders cover all six widths; matched-state [after mobile](../artifacts/stage4_2/after-mobile.png) is also included. The initial `before-mobile.png` capture has repeated viewport tiles and is retained only as a capture limitation, not reliable whole-page baseline evidence. A similar final capture was replaced after waiting for a settled viewport. Separate viewport captures and final full-page captures were visually reviewed.
- [Learning-plan PDF](../artifacts/stage4_2/learning-plan.pdf) and [PDF checks](../artifacts/stage4_2/pdf-checks.json): extracted text and parsed `/Link` URI annotations verify the official Catapult URL is clickable in this Chrome PDF. All five rendered PNG pages were visually inspected without clipping. Source review date and the museum's supplied-ball safety statement each occur once. Program facts remain read-only; real local edits and teacher review are labeled accurately. Print excludes navigation, technical identifiers and capability tokens. Other browser print engines and longer edited plans may paginate differently.

## Performance, files and preservation

No dependency or lockfile changes, remote fonts, analytics, images or trackers were introduced. Production output is 247.82kB JavaScript (76.66kB gzip) and 27.79kB CSS (6.92kB gzip), about 2.49kB combined gzip growth over Stage 4.1. Quick Start, navigation, comparison, editing and printing add no model requests. **No Portkey inference occurred; no new provider token usage or cost is claimed.**

Modified existing files: `README.md`, `frontend/src/App.tsx`, `frontend/src/styles.css`, `frontend/src/components/Intake.tsx`, `frontend/src/components/ProgramDetails.tsx`.

New implementation/test files: `frontend/src/examples.ts`, `frontend/src/stage4_2.test.tsx`, `frontend/scripts/museum-style-audit.mjs`, `frontend/scripts/browser-stage4-2.mjs`. New documentation: this receipt and `docs/museum_visual_reference.md`. New evidence: `artifacts/stage4_2/`, inventoried with hashes in `file_manifest.json`.

The catalog, matching engine, backend, existing tests, historical Stage 1–4.1 evidence and dependencies remain unchanged relative to the captured Stage 4.1 working-tree baseline. `LearningPlan.tsx`, `presentation.ts` and `api.ts` reuse their existing behavior unchanged. Integrity results and outside-workspace comparison are recorded in `integrity_checks.json`. The pre-existing uncommitted Stage 4/4.1 changes were not reverted or included in a new commit. Branch remains `main` at `251e3143cc15f9178faf871422934840d7be2b3c`. No commit, remote, push or Stage 5 work was performed.

## Reproduce and review

From the repository root:

```sh
.venv/bin/python -m pytest -q
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run build
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8008 --no-access-log
```

In another terminal, run `npm --prefix frontend run dev` and open `http://127.0.0.1:5173`. With both servers running, from `frontend/`, run `node scripts/browser-stage4-2.mjs` for offline regression. `node scripts/museum-style-audit.mjs` separately reruns the one-time official-site audit; it is not part of application runtime. Both scripts require local Chrome and write this stage's artifacts only.

For personal review, refresh the application to begin a new session, load an example, adjust fields and explicitly acknowledge USD before Discover Programs. Ordinary manual recommendation/generation actions still use the configured live backend; only the isolated test browser contexts replay responses. Live provider availability was not retested during cosmetic work. The next requested action is user review, not Stage 5 or a Git checkpoint.
