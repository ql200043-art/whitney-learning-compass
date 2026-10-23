# Stage 4.3 — Museum-inspired color and visual accents

Validated October 23, 2026. This stage changes frontend presentation only. It preserves the approved Stage 4.2 workflow, deep-green editorial identity, warm paper surfaces, typography, compass, mobile navigation and three-phase learning journey.

## Verified museum colors

The Stage 4.2 [museum audit](museum_visual_reference.md) remains unchanged. For this stage, Chrome directly reopened the [official school-program catalog](https://www.eliwhitney.org/workshop/school-programs) and read `getComputedStyle()` on the first grade badge for each distinct published label. The exact locators, RGB values, foreground colors, opacity, dimensions and timestamp are in [museum-grade-colors.json](../artifacts/stage4_3/museum-grade-colors.json).

| Published label | Verified museum fill | RGB | Application text | Measured text contrast |
| --- | --- | --- | --- | --- |
| K; also PreK if published | `#9E81BA` | 158, 129, 186 | `#17251D` | 4.78:1 |
| 1, 2 | `#5E9DD1` | 94, 157, 209 | `#17251D` | 5.47:1 |
| 3, 4 | `#789A5B` | 120, 154, 91 | `#17251D` | 4.98:1 |
| 5, 6 | `#D6AC6F` | 214, 172, 111 | `#17251D` | 7.57:1 |
| 7+ | `#952F2B` | 149, 47, 43 | `#FFFEF7` | 7.64:1 |

Each inspected badge uses `.views-row .key span[class="LABEL"]`, a solid fill with opacity 1 and no background image. The audit confirmed that 7+ is actually brick red and that the ochre applies to Grades 5–6; these are not inferred mappings. The museum uses white badge text, but the application deliberately uses dark text on the lighter fills for contrast. These observed website styles are not represented as an official brand specification.

Unknown future labels are preserved literally and receive neutral `#EEF3F5`, not an inferred grade group. Missing/empty grade lists display “Not published.” The component never normalizes labels, expands 7+, changes eligibility or calculates a match. The supported PreK presentation does not add any program or intake eligibility.

## Actions and visual hierarchy

Brick red now applies only to deliberate discovery/selection/generation actions:

- Discover Programs, including its existing loading label.
- Select This Program on recommendation cards.
- Select [program name] within desktop and mobile comparison.
- Generate Learning Journey.

Back, navigation, comparison toggles, review and print retain their existing green or neutral treatment. Explicit eligibility labels and their original green/amber/red status palettes remain unchanged. All recommendation cards use the same thin brick rule; it does not encode subject, fit, failure or booking readiness.

| Token or treatment | Value / change | Provenance |
| --- | --- | --- |
| `.primary.action-accent` | Deep teal → existing `--museum-brick: #952F2B` | Verified museum action color |
| `--action-brick-hover` | `#7E2724` | Original application shade |
| `--action-brick-active` | `#69211E` | Original application shade |
| Focus | Existing `#952F2B`, 3px outline with 3px offset | Existing app focus design using museum color |
| `--action-disabled-surface` / `--action-disabled-text` | `#EEE5E2` / `#675552` | Original application choices; opacity stays 1 |
| `--grade-purple` / `--grade-blue` | `#9E81BA` / `#5E9DD1` | Verified museum fills |
| `--grade-text` | `#17251D` | Original accessible foreground choice |
| Grade olive / gold / brick | Existing `--museum-olive`, `--gold`, `--museum-brick` | Verified grade mapping above |
| Card accent | 3px brick top border | App treatment of verified color |
| Educational-fit block | `#EEF3F5` with 3px `#A8B5BA` side rule | Existing museum-inspired tokens; not an official educational classification |

The reusable `PublishedGrades` component supplies recommendation cards, both comparison layouts, selection review and the selected-program overview in Learning Journey/Review. It exposes a labeled list with visible original labels, using 32px minimum circles/pills and natural wrapping. These badges are informational, not interactive controls. On recommendation cards the published-grade group spans the fact grid, keeping the badges readable; fees, duration and status remain prominent. The AI interpretation block stays explicitly labeled. No museum branding asset was imported.

Print CSS retains the same labels with dark text, outlines and white fills so background-print settings cannot erase grade information. This stage did not create a new PDF export or claim a newly validated page count; the Stage 4.2 PDF remains historical evidence.

## Executed tests and browser checks

| Check | Actual result |
| --- | --- |
| Python suite | **222 passed, 0 failed**, 2.29s |
| Frontend suite | **98 passed, 0 failed**, seven files; all 91 prior tests plus seven new tests |
| TypeScript | Passed |
| Production build | Passed, 38 modules |
| Browser assertions | **371 passed** |
| Layout inspections | **24** across 1440, 768, 390 and 320px |
| Axe scans | **25**, zero detected violations |
| Browser JavaScript errors | Zero |

New unit tests verify exact K/7+ labels and ordering, missing labels, literal unfamiliar labels, parity with all 20 catalog records, shared card/overview rendering and desktop/mobile comparison selection. Existing eligibility, intake, uncertainty, editing, safety and API tests remain unchanged and pass.

The browser script is adapted from the retained Stage 4.2 regression. Each requested viewport completes intake, recommendations, comparison, explicit selection, journey editing and review, using saved sanitized Stage 4.1 responses. GET health/catalog requests use the real local backend. All recommendation/journey POSTs are intercepted. One successful complete run contains eight offline POST replays plus a controlled provider-error case; the successful run was repeated to capture closer visual details. No provider inference occurred during either run or during the initial interrupted assertion attempt.

The first attempt found a test-script assertion that expected the computed CSS outline shorthand in the wrong property order. Chrome reported `rgb(149, 47, 43) solid 3px`; the test now checks `outlineWidth` and `outlineStyle` separately. No app fix was needed. The initial failure record is retained as `browser-attempt-1-*`; the final result is in [browser-regression.json](../artifacts/stage4_3/browser-regression.json).

Real browser measurements cover normal, hover, active and keyboard-focus states for all three main actions at all four widths. Actual disabled/loading Discover buttons were also measured. Text contrast is **7.64:1 normal/focus, 9.43:1 hover, 11.31:1 active, 5.65:1 disabled/loading**. The original labeled status colors also pass the existing contrast checks. Temporary CSS samples verify every grade color, including labels absent from the replayed programs; they are not presented as program results. Actual rendered program badges are independently checked against published labels and container boundaries.

No horizontal page overflow, overlapping entry fields or overflowing badge lists were found in the tested screens. Existing 44px control targets and phone sizing remain intact. The screenshots were visually inspected for card balance, spacing, readable labels, unchanged uncertainty and action hierarchy. Quick Start, selection, navigation, comparison and edits retain the established behavior; temporary workflow capabilities remain absent from DOM, URLs and persistent storage.

Automated scanning does not establish full WCAG compliance. Axe records incomplete items for color contrast and a desktop comparison ARIA item; actual sampled contrast, focus and controls were checked separately. Physical-phone keyboards, Safari and full screen-reader operation were not retested. Badges are noninteractive information and do not need 44px touch targets. Other browser print engines were not tested in this stage.

## Genuine visual evidence

All updated screenshots below come from actual Chrome renders of the local app with clearly identified offline replay. Full-screen and close-up images are both available.

| View | Evidence |
| --- | --- |
| Desktop intake before / after | [Before](../artifacts/stage4_3/intake-before-1440.png) · [After](../artifacts/stage4_3/intake-1440.png) · [CTA detail](../artifacts/stage4_3/intake-1440-detail.png) |
| Desktop program cards before / after | [Stage 4.2](../artifacts/stage4_2/recommendations-1440.png) · [Stage 4.3](../artifacts/stage4_3/recommendations-1440.png) |
| Desktop comparison | [Full view](../artifacts/stage4_3/comparison-1440.png) · [Comparison detail](../artifacts/stage4_3/comparison-1440-detail.png) |
| Desktop teacher selection | [Selection](../artifacts/stage4_3/selection-1440.png) |
| Desktop learning journey | [Journey](../artifacts/stage4_3/journey-1440.png) · [Read-only overview](../artifacts/stage4_3/journey-1440-detail.png) |
| Tablet | [Recommendations, 768px](../artifacts/stage4_3/recommendations-768.png) · [Comparison](../artifacts/stage4_3/comparison-768.png) |
| Mobile recommendations | [390px card detail](../artifacts/stage4_3/recommendations-390-detail.png) · [320px card detail](../artifacts/stage4_3/recommendations-320-detail.png) |
| Mobile comparison | [390px full view](../artifacts/stage4_3/comparison-390.png) · [Grade detail](../artifacts/stage4_3/comparison-390-detail.png) · [320px full view](../artifacts/stage4_3/comparison-320.png) |
| Mobile selection / journey | [Selection](../artifacts/stage4_3/selection-390.png) · [Journey](../artifacts/stage4_3/journey-390.png) |

The desktop before/after recommendations use the same offline fixture and viewport. Intake comparisons use the same Force & Motion preset, $400/90-minute values and explicit USD acknowledgment. Focus may differ because the updated screenshot also exercises keyboard navigation.

## Files, preservation and reproduction

Modified existing files:

- `frontend/src/styles.css`
- `frontend/src/App.tsx` — class name on the existing generation button only
- `frontend/src/components/Intake.tsx` — class name on the existing submit button only
- `frontend/src/components/ProgramDetails.tsx`

New files:

- `frontend/src/components/PublishedGrades.tsx`
- `frontend/src/stage4_3.test.tsx`
- `frontend/scripts/browser-stage4-3.mjs`
- `docs/stage4_3_validation.md`
- Evidence under `artifacts/stage4_3/`, including test logs, JSON, screenshots, integrity results and a file manifest.

No dependencies were added. Production output is 248.18kB JavaScript (76.77kB gzip) and 29.97kB CSS (7.32kB gzip), about 0.51kB additional combined gzip over Stage 4.2. No remote assets, analytics, persistence or extra runtime requests were introduced.

From the repository root:

```sh
.venv/bin/python -m pytest -q
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

With existing local servers running on 8008 and 5173, run `node scripts/browser-stage4-3.mjs` from `frontend/` to reproduce the offline browser checks. It requires local Chrome, writes only this stage's evidence and never contacts Portkey. The museum audit is a one-time browser observation, not a runtime scraper; its JSON records enough locator/property information to repeat the readings manually.

The captured Stage 4.2 baseline verifies that catalog, backend APIs, both agents, matching code, existing tests, dependencies and all previous validation evidence remain unchanged. Outside-project metadata and change hashes are recorded in `artifacts/stage4_3/integrity_checks.json`. The original Stage 3 checkpoint remains at `251e3143cc15f9178faf871422934840d7be2b3c` on `main`.

**No Portkey inference, new token usage, commit, remote, push, autosave, draft import/export or Stage 5 work occurred.** No known automated regression remains failing. Next step: the user's visual review.
