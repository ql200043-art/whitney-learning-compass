# Stage 4.4 — Local draft autosave and recovery

Validated October 23, 2026. This stage adds one browser-local instructional draft, without changing the backend, agents, matching rules, catalog or live human-selection workflow. HEAD remains `668e372a525e197535c245c17cc35240a1f4a1e0` on `main`. No commit or push was made.

## Persistence architecture and allowed fields

`frontend/src/draftStorage.ts` explicitly projects a document into `localStorage`; it never serializes an entire API response. `useLocalDraft.ts` owns debounce, storage operations, conflict checks and lifecycle handlers. App keeps a restored document separate from a live `Journey`, clears the capability reference on restore, and reuses `LearningPlan` with a distinct historical-facts renderer.

| Stored field group | Contents |
| --- | --- |
| Version and local metadata | Schema version 1, random local document ID (not authorization), ISO creation/last-edit timestamps |
| Program snapshot | Real program ID/name/canonical URL; description, published grade labels, subjects, fee label, duration, calculated subtotal, currency assumption, original source-review date |
| Historical uncertainty | Eligibility at generation, provisional flag, unresolved mandatory conditions, museum questions, safety/source limitations, human-readable source support and whether standards were published |
| Class requirements | Grades, student count, goal, budget/currency/acknowledgment, duration, interests, required standards and allowlisted mandatory operational requirements |
| Instructional content | Original and edited Before/During/After fields, teacher notes, inquiry text and review acknowledgment |

No workflow capability, server workflow/run/plan ID, API key, provider headers, model prompts, raw evidence objects, execution logs or authentication state is stored. Original versus edited suggestions remain distinguishable. Official facts stay read-only. Existing audit artifacts remain intact outside the draft.

The validator checks exact keys recursively, required fields, types, bounds, dates, numeric values, enums and phase structure. Unknown extra keys are rejected. The serialized limit is 300,000 JavaScript string characters. A bundled, minimal `programIdentities.json` pins the 20 genuine IDs to canonical names and URLs; a test compares the whole index against the unchanged catalog. It contains no eligibility rules. An eventual catalog identity change must update this index deliberately. Unsafe schemes, alternative hosts, credentials in URLs, unknown program IDs and mismatched names cannot be restored. React renders text normally; no HTML interpretation was introduced.

## Saving, recovery and deletion

- A successfully generated plan starts autosaving if the browser has no prior draft. Each content change restarts a **650 ms** debounce. Saving covers every instructional field, notes, inquiry and review status. Equivalent content does not produce repeated writes. Creation time is retained; edit time updates on actual successful writes.
- The interface shows **Saving…** while pending and **Saved on this device** only after successful `setItem`, or when displaying an existing validated saved copy. Storage errors pause saving and advise printing; an explicit save action permits a retry.
- `pagehide` and hidden-page visibility changes attempt a synchronous flush. These are best effort, not a crash-proof durability guarantee. Ordinary Journey/Review navigation retains shared React state and pending saves.
- Startup checks storage and offers **Restore Draft**, **Start Fresh**, and **Delete Saved Draft**. Recovery is never automatic. Start Fresh dismisses the offer without deleting the existing copy.
- Restore re-reads and validates storage, then opens only **Edit Saved Plan / Review & Export** navigation. It does not fabricate completed backend steps, restore a capability, request recommendations, or regenerate a journey. Replacing an already-open workflow/document with the saved copy requires confirmation.
- **Delete Saved Draft** uses an explicit browser confirmation describing the saved-copy-only consequence. Deletion cancels pending work and disables saving before removal. The in-memory editor remains available. Editing alone after deletion does not recreate the entry; **Save This Plan on This Device** or an explicitly initiated new plan is required.
- A new generated plan cannot silently overwrite an existing draft, even for the same program. **Replace Saved Draft** requires confirmation. Canceled replacement preserves the old copy and leaves the new plan available in memory.
- A `storage` event pauses saving when another tab changes or deletes the entry. The user can restore the other copy or explicitly replace it. Each write/removal also compares the latest stored value with the expected/consented value, including changes while confirmation was open. There is no merging or collaborative editing.

## Historical facts, safety and privacy

The recovered editor and printed plan prominently say **Saved Draft — Not Revalidated**, using the actual saved timestamp. Grade/price/duration information is a historical snapshot. The old decision is labeled **At generation … (historical; not revalidated)**, without the live green eligibility badge. Source-review date remains the original date, not today's edit date. Booking stays unconfirmed; missing duration, mandatory unknowns, safety restrictions and USD interpretation remain visible. The original museum hyperlink is retained.

**Start New Plan** returns to ordinary intake; new inference still requires current backend validation and explicit teacher selection. No local draft is passed to a new model request automatically. Startup health/catalog reads may occur but neither are required to restore, edit or print. No draft data is uploaded for persistence.

The privacy notice states that drafts are saved only in this browser/device and not shared with the museum. It tells teachers not to enter student names, private records or secrets. Free text is not a personal-information detector: users can still paste sensitive text, so local storage is not described as encrypted or secure against other users of the browser or same-origin scripts.

## Executed automated checks

| Check | Actual result |
| --- | --- |
| Existing Python suite | **222 passed, 0 failed**, 2.19 seconds |
| Frontend suite | **153 passed, 0 failed**, 10 files, 3.96 seconds |
| Existing frontend regression coverage | All **98** prior tests retained and passing; **55** added tests |
| TypeScript | Passed |
| Production build | Passed, 42 modules; no dependency changes |
| Git whitespace check | Passed |

Evidence: [Python](../artifacts/stage4_4/python-tests.txt), [frontend](../artifacts/stage4_4/frontend-tests.txt), [typecheck](../artifacts/stage4_4/typecheck.txt), [build](../artifacts/stage4_4/build.txt).

New tests execute projection, validation, hook storage writes and React interactions. They cover debounce/no-op writes; all phases/notes/inquiry/review; lifecycle flush; read/write/quota/removal errors; malformed/oversized/versioned documents; missing fields; invalid IDs/URLs; secret-field exclusion; escaped HTML-like text; optional recovery; offline editing/printing; historical unknown duration and eligibility; original-versus-edited labels; pending-save deletion; explicit resaving; replacement cancellation; other-tab events and stale confirmation checks. Test cleanup clears localStorage for isolation. Existing test assertions were not changed.

An initial new identity-index test used `program_id` instead of the catalog's existing `id` field. Its failure was repaired in the test reference; the catalog and identity index were unchanged. The retained progress log records that failure. The original 98-test suite also passed separately before the new tests were added.

## Genuine browser and print evidence

[Browser script](../frontend/scripts/browser-stage4-4.mjs) exercised actual Chrome at **1440, 390 and 320 px**. All API responses were intercepted and replayed; restored-mode checks blocked API access before reload. These are real browser interactions with offline responses, **not live Portkey runs**. Catapult teaching content comes from retained sanitized Stage 4 evidence. A clearly labeled Simple Machines replacement fixture uses actual catalog facts and matching results with hand-authored test suggestions; it is not represented as an AI-generated result.

The final run passed **109 assertions**, **12 layout inspections**, and **9 Axe scans with zero detected violations**, with **zero browser JavaScript errors**. Eight intercepted POSTs represent four deliberately initiated fixture workflows (Catapult at three sizes, plus Simple Machines replacement). Recovery, editing, saving and printing added no POSTs. An earlier successful browser run was repeated after improving print spacing and making the simulated backend unavailable before recovery startup; neither run contacted a provider.

Verified scenarios:

1. Edit an objective, During activity, notes and inquiry; wait for confirmed storage; refresh; choose Restore; recover edits; edit the After activity and retain it through Review.
2. Restore/read/edit/print while backend API requests are blocked. No authorization or activity controls are reconstructed.
3. Cancel deletion; then confirm deletion, retain the open document, wait beyond the debounce, reload and verify no recovery offer. Normal intake remains available.
4. Generate a different program's fixture plan while Catapult is saved. Verify no overwrite, cancel replacement, then confirm replacement and inspect the correct Simple Machines identity/content. A genuine second browser tab modifies storage and triggers the pause warning.
5. Inject corrupted JSON in the isolated browser context; verify safe error messaging, no Restore action and a functioning Start Fresh path. Unsupported versions and blocked/quota storage are additionally covered by automated component/hook tests.

The [actual localStorage snapshot](../artifacts/stage4_4/storage-inspection.json) was inspected for workflow tokens, IDs, API credentials and traces: none were present. Only the single allowlisted document key was present in the isolated browser. The snapshot contains only synthetic class-level test inputs and replayed public educational content. See [browser results](../artifacts/stage4_4/browser-regression.json) and [security/preservation checks](../artifacts/stage4_4/integrity-checks.json).

| State | Desktop | Mobile evidence |
| --- | --- | --- |
| Saving / saved | [Saving](../artifacts/stage4_4/saving-1440.png), [saved](../artifacts/stage4_4/saved-1440.png) | [390 px](../artifacts/stage4_4/saved-390.png), [320 px](../artifacts/stage4_4/saved-320.png) |
| Optional recovery | [1440 px](../artifacts/stage4_4/recovery-1440.png) | [390 px](../artifacts/stage4_4/recovery-390.png), [320 px](../artifacts/stage4_4/recovery-320.png) |
| Historical document | [1440 px](../artifacts/stage4_4/restored-1440.png) | [390 px](../artifacts/stage4_4/restored-390.png), [320 px](../artifacts/stage4_4/restored-320.png) |
| Recovered editor | [1440 px](../artifacts/stage4_4/restored-editing-1440.png) | [390 px](../artifacts/stage4_4/restored-editing-390.png), [320 px](../artifacts/stage4_4/restored-editing-320.png) |
| Deleted copy, open plan retained | [1440 px](../artifacts/stage4_4/deleted-1440.png) | [390 px](../artifacts/stage4_4/deleted-390.png), [320 px](../artifacts/stage4_4/deleted-320.png) |
| Replacement / conflict | [Replacement](../artifacts/stage4_4/replacement-1440.png), [other tab](../artifacts/stage4_4/tab-conflict-1440.png) | Same wrapping control styles |
| Corrupt storage | [1440 px](../artifacts/stage4_4/corrupt-1440.png) | [390 px](../artifacts/stage4_4/corrupt-390.png), [320 px](../artifacts/stage4_4/corrupt-320.png) |

The [restored printable plan](../artifacts/stage4_4/restored-learning-plan.pdf) is **five pages**. Its extracted text contains all three tested edits, historical notice, source URL and independent-prototype disclaimer. Two actual PDF link annotations target the official Catapult URL; displaying URL text was not treated as sufficient. All pages were rendered with PDFKit and visually inspected. Initial printing left the disclaimer alone on page six; modest print-only spacing changes to historical source notes removed that orphaned page without removing content. Final [print checks](../artifacts/stage4_4/print-inspection.json) and `printed-page-1.png` through `printed-page-5.png` preserve the result. Page count can vary with edits and browser settings.

No horizontal overflow or undersized draft-action buttons was found at the tested sizes; draft buttons measure at least 44px high. Recovery uses the approved brick-red primary action, existing green/neutral secondary controls, paper panels, grade badges and typography. Saving status uses polite announcement. Native confirmation dialogs provide an explicit keyboard-accessible choice. Automated Axe checks are not a full accessibility certification; physical phones, Safari and comprehensive screen-reader use were not tested.

## Files and reproducibility

Modified:

- `README.md` — local draft operation and corrected session-memory explanation.
- `frontend/src/App.tsx` — local document state, recovery/save controls and scoped navigation.
- `frontend/src/components/LearningPlan.tsx` — shared editor for live and historical documents.
- `frontend/src/styles.css` — small draft/mobile/print additions.
- `frontend/src/test/setup.ts` — browser-storage test isolation.

Created:

- `frontend/src/draftStorage.ts`, `frontend/src/useLocalDraft.ts`, `frontend/src/programIdentities.json`.
- `frontend/src/components/DraftDetails.tsx`.
- `frontend/src/draftStorage.test.ts`, `frontend/src/useLocalDraft.test.ts`, `frontend/src/DraftWorkflow.test.tsx`, `frontend/src/test/draftFixture.ts`.
- `frontend/scripts/stage4-4-fixtures.py`, `frontend/scripts/browser-stage4-4.mjs`.
- This document and `artifacts/stage4_4/` (test logs, offline fixture, browser checks, inspected storage, screenshots, PDF and page renders). See its [file manifest](../artifacts/stage4_4/file-manifest.json).

From the repository root:

```sh
.venv/bin/python -m pytest -q
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run build
.venv/bin/python frontend/scripts/stage4-4-fixtures.py
npm --prefix frontend run dev
```

With the frontend running on `127.0.0.1:5173`, in a second terminal:

```sh
cd frontend
node scripts/browser-stage4-4.mjs
```

The browser script uses installed Google Chrome, isolated contexts and intercepted API routes. It requires no key or running backend and never modifies a teacher's normal browser profile. Browser confirmation results are asserted; screenshots show before/after states, not the native confirmation dialog itself. Standard app setup remains in README.

## Limits and preserved boundaries

One draft exists per origin/browser/profile. Clearing site data, private browsing, storage denial or quota limits can prevent persistence. Lifecycle flush cannot guarantee survival of an OS/browser crash before the write. The frontend must be served to reopen the site; this stage does not add an offline app cache. Browser-local content is neither encrypted nor cryptographically authenticated: structural validation does not prove historical facts are untampered or current. It never authorizes server actions.

Storage events plus read-before-write checks reduce conflicting-tab loss, but localStorage has no atomic compare-and-swap across tabs. Extremely simultaneous writes can still race; use one editor tab. There is no merging, backup history, cloud sync, account or import/export. A saved draft's snapshot timestamp remains the one shown when opened; the toolbar reports subsequent successful local edits. No automatic catalog reconciliation occurs.

The 20-program catalog, matching modules, backend, agents, Python tests, prior validation receipts, prior evidence and dependencies were checked unchanged against the starting files. All edits and generated artifacts stayed in this project; no unrelated workspace files were edited. **Zero Portkey inference calls**, no token usage incurred for this stage, no new backend persistence endpoint, no booking/email/payment integration, no commit/push and no Stage 5 work. The approved checkpoint remains intact, with Stage 4.4 changes left uncommitted for review.
