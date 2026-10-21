# Program data dictionary

**Version:** 1.0.0  
**Review date:** October 21, 2026 (America/New_York)  
**Dataset:** [programs.json](../data/programs.json)

## Scope, authority, and grain

One record represents **one official school-program offering**, not a visit, booking, grade, or lesson-plan variant. The planned curated catalog has 20 records; the Stage 1 pilot has five. Fifteen additional identities are listed in [the expansion plan](catalog_expansion_plan.md) and are not yet recommendation-ready.

Primary source: the museum's [official school-program catalog](https://www.eliwhitney.org/workshop/school-programs) and the program detail pages linked from it. Preserve the official linked URLs; do not generate slugs from titles. Project-assigned IDs are not museum-issued identifiers.

Direct, current official detail-page content controls program facts. Catalog listings corroborate identity and grade labels. Search/indexed or extracted views can be stale or include duplicate content; retain material discrepancies and verify them in the live official page. If sources still disagree, mark affected fields pending/conflicting and do not assert eligibility.

## JSON envelope

| Field | Type | Meaning |
| --- | --- | --- |
| `schema_version` | string | Semantic version of this documented structure; currently 1.0.0. |
| `dataset_id` | string | Stable project dataset identifier. |
| `project_name` | string | Whitney Learning Compass. |
| `stage` | integer | 1 for the historical pilot; 2 for the expanded reviewed catalog. |
| `target_program_count` | integer | Planned curated count, 20; not the current record count. |
| `curated_on` | ISO date string | Date records were assembled/reviewed. |
| `date_timezone` | string | America/New_York; dates use the user's local calendar. |
| `primary_catalog_url` | HTTPS URL | Official discovery source. |
| `coverage_note` | string | Curated selection and independence disclaimer. |
| `programs` | array of Program | Five preserved pilot records in Stage 1; 20 reviewed records in Stage 2. |

## Program fields

Required keys remain present even when their values are null. Arrays use **null for unavailable data**, not an empty array that might falsely imply confirmed absence.

| Field | Type / allowed values | Definition and rules |
| --- | --- | --- |
| `id` | unique string | Stable local ID, e.g. `ewm-simple-machines`; never reuse an ID for a different program. |
| `official_name` | string or null | Exact page heading; preserve punctuation/capitalization. |
| `official_url` | HTTPS URL | Official detail link discovered in the catalog. Unique among records. |
| `grade_levels` | array of strings or null | Exact museum tokens, such as `K`, `1`, …, `6`, `7+`; future catalog may include `PreK`. Do not silently cap or expand “7+.” |
| `in_scope_grade_levels` | array of integers or null | Derived eligible grades within 2–7 only. Exact tokens map directly; “7+” supports grade 7 within this product scope. Preserve lower grades in `grade_levels`, even though they are out of initial scope. Conflicting/unknown source eligibility must not produce confirmed grades. |
| `subjects` | array of strings or null | Exact published subject labels. Deduplicate repeated layout renderings, not distinct labels. “Energy Transfer” and “Transfer of Energy” remain separate source labels. |
| `description` | string or null | Concise factual paraphrase of the published activity, without added outcomes, guarantees, or instructional claims. |
| `price` | object | Published program-fee information, defined below. |
| `duration` | object | Published session time and documented conversion, below. |
| `published_standards` | array of Standard or null | Only program-specific publicly published standards evidence. Null in all five pilot records. General catalog claims about standards do not establish a program's code. |
| `group_size` | object | `min_students` and `max_students`: positive integers or null. Both unknown in the pilot. |
| `accessibility_notes` | string or null | Program-specific published accommodations/access details; null if not found. Do not infer from the grade range. |
| `booking_availability` | string or null | Verified published booking availability if later available; null in pilot. A live detail page does not establish bookability. |
| `verification` | object | Review status/date, unknown source update date, and material notes. |
| `sources` | nonempty array of Source | Evidence provenance local to this record. |
| `field_evidence` | object keyed by JSON Pointer | Map factual/derived fields and unknown field groups to source IDs, source sections, evidence status and notes. |
| `unknown_fields` | array of UnknownField | Explicit inventory of unresolved null fields, reasons and next verification action. |

### Price

| Field | Type | Rule |
| --- | --- | --- |
| `listed_text` | string or null | Short verbatim price label, e.g. “$14.00 per student.” |
| `amount` | nonnegative number or null | Numeric published amount, in displayed major units; 14.00 → 14. No discounts, minimum charges or taxes inferred. |
| `currency_symbol` | string or null | Preserve the published “$” symbol. |
| `currency_code` | ISO currency string or null | **Null in pilot:** reviewed labels do not explicitly state an ISO code. US dollars are a plausible contextual interpretation, not separately verified information. |
| `basis` | `per_student` or null | Verified from “per student”; this is a workshop program fee. |

The future cost tool may calculate `student_count × amount` using decimal arithmetic only after confirming the relevant currency and fee basis. For display-only comparison, keep the original “$” label and disclose currency-code uncertainty. A currency-sensitive hard budget check remains pending until its currency is established.

Never treat unknown prices as zero. Never call a program-fee subtotal a **total field-trip cost**. Transportation, meals, other charges, discounts, scheduling and booking terms are outside these published per-student prices unless independently sourced.

### Duration

- `listed_text`: string or null, preserving a short published label such as “1.50 hours.”
- `minutes`: positive integer or null; convert documented hours × 60. **1.50 hours = 90 minutes**, not 150.
- Bridges has both fields null because its reviewed detail page does not publish session time.
- Duration refers to the workshop session; it does not include travel or an entire visit.

### Standard (future records)

Each entry has `framework`, `code`, `statement` (each string or null) and a required `source_id`. At least one of code/statement must contain published information, and source evidence must establish its connection to this program. Do not fill missing standards from subject similarity or a model's knowledge. Preserve any generated suggested alignment separately from `published_standards`.

### Verification, source, and evidence objects

`verification` contains:
- `status`: `verified_with_unknown_fields`, `verified`, `pending_verification`, or `conflicting`. “Verified” concerns reviewed source content; it is not a guarantee of delivery or bookability.
- `verified_on`: ISO date or null. Null when no official source was successfully reviewed. A successful access to only the index cannot verify missing detail-page fields.
- `source_updated_on`: ISO date or null. Null in pilot because the reviewed page does not supply a program update date. A copyright year is not an update date.
- `notes`: array of review/limitation notes.

Each `sources` entry contains `source_id`, `url`, `title`, `source_type` (`official_program_page`), `access_method` (`live_browser_review` in pilot), and `accessed_on` (ISO date). Source IDs need only be unique within a program record.

Each `field_evidence` item contains:
- `source_id`: an ID that must resolve in this record's `sources`.
- `locator`: human-readable page section, e.g. “School Program Price”; avoid unstable search-tool line numbers.
- `status`: `verified` (direct), `normalized` (mechanical conversion), `paraphrased` (factual summary), `unknown`, `pending_verification`, or `conflicting`.
- `note`: concise description of the evidence/normalization or the limit of an absence check.

Evidence can point to an object (e.g. `/price`) and cover its children; a more specific pointer (e.g. `/price/currency_code`) overrides the parent. IDs and review metadata are project-authored, not claims that the museum publishes those identifiers.

Each `unknown_fields` item contains `field` (JSON Pointer), `reason` and `next_step`. Reasons used here are `not_published_on_reviewed_page`, `not_explicitly_published`, and `requires_confirmation`; future inaccessible-page records use `official_page_inaccessible`. A null describes a gap, not a factual “no,” zero, unlimited capacity or confirmed absence. For an inaccessible page, use null for every unverified detail field, record the access problem, and retain only independently verified catalog identity/URL/grade information with separate catalog evidence.

## Hard constraints and educational preferences

| Input | Default treatment | Required behavior |
| --- | --- | --- |
| Every class grade | Hard | Check all requested grades against supported eligibility; any failure excludes a confirmed match, any uncertainty remains pending. |
| Maximum program-fee budget | Hard if teacher requires it | Require positive integer class size, known fee amount/basis and confirmed compatible currency. Do not substitute a travel budget. |
| Maximum workshop minutes | Hard if specified | Compare known session duration; an unknown duration is pending. Keep travel/whole-trip time separate. |
| Required capacity, access needs or booking date | Hard if specified | Use explicit relevant evidence or museum confirmation. Null does not pass; do not infer from general website availability. |
| Subject interest, curriculum goal, interdisciplinary theme, preferred activity | Soft by default | Rank fit using published subjects/descriptions and explain the interpretation. A weaker preference cannot override a hard failure. |
| Specific standard | Teacher decides whether mandatory | Missing published alignment is unknown; never fabricate a code. A proposed alignment may support discussion, not confirmed compliance. |

Keep intake requirements separate from preferences rather than converting every stated goal to a filter. Use pass/fail/unknown per hard constraint, and distinguish “no confirmed match” from “no candidate exists.” A candidate with unresolved required conditions can be shown in a clearly marked confirmation list, not labeled eligible.

## Data quality and maintenance rules

- Unique IDs/URLs; names should agree with the official page. Validate types, positive minutes, fee basis and evidence references.
- Null arrays mean unknown; no empty strings, “N/A,” zero, or fabricated placeholder URLs as missing-data substitutes.
- Every factual field is source-backed; every normalization is reproducible. Project editorial categories and ranking assumptions remain separate.
- The live Tangrams page supports “7+.” An earlier web-extracted version also exposed a separate grade line ending at 6. Live-page inspection resolved that discrepancy for this pilot; do not reintroduce the older line as a second offering.
- Wind Power was successfully reviewed directly in a live browser after the web-fetch tool returned a cache miss. It is not left pending solely because that research tool failed.
- All five pages lack program-specific standards codes, capacity limits, accommodation details, availability, an explicit ISO currency code and a source-update date in the reviewed content. These remain unknown; other museum pages were not used to fill program-specific gaps.
- Recheck source facts before use in a later release and before making booking-sensitive claims; store a new review date when actually re-reviewed. Do not silently overwrite a source conflict or treat the review date as a museum update date.
- Stage 1 records manual research only. No automated scraper or refresh process has been implemented.

## Pilot completeness

All five records have verified identity, official URL, grade tokens, subject labels, concise source-grounded description, and published per-student amount. Four have verified 90-minute durations; Bridges' duration is unknown. All five retain explicit unknowns and field evidence. See [Stage 1 validation](stage1_validation.md) for the executed local checks.

## Stage 2 implementation clarification — October 21, 2026

The catalog now contains 20 reviewed records; the five original program objects are unchanged. The record schema remains version 1.0.0. Stored `id` is the stable program identifier; matching outputs expose the same value as `program_id` without renaming source fields.

The amended [project scope](project_scope.md) governs application decisions. Its explicitly disclosed USD assumption can support budget checks without filling unpublished `currency_code` values. This supersedes the earlier conservative currency-planning paragraph above, while preserving that paragraph's source distinction. Only explicit mandatory operational requirements enter hard eligibility; ordinary operational unknowns remain separate confirmation items. Verified failures take precedence over unknowns. See [matching rules](matching_rules.md).

Editorial themes are in `data/program_themes.json`, keyed by program ID, with definitions, `supported_editorial` or `uncertain` status, rationale, field pointer, source ID and URL. They are not museum subject labels. Generated `data/coverage.json` records distinct IDs and evidence per grade/theme cell and separates uncertain assignments. Neither file changes program facts.

Stage 2 also uses unknown reason `linked_documents_unverified` where linked program materials could not be read. No standards are asserted from those documents. Published time/fee versus delivery ambiguities are retained in verification notes, notably Resourceful Schools' two-session recommendation. See [research ledger](catalog_research.md) and [Stage 2 validation](stage2_validation.md) for current completeness and limitations.

