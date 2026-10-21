# Deterministic matching rules and Stage 3 interface

**Stage 2 implemented:** October 21, 2026.  
**Authority:** [Stage 1.1 project scope](project_scope.md). No agents or model calls are part of this module.

## Structure and public functions

| Module / function | Contract |
| --- | --- |
| `matching.catalog.load_catalog(path=None)` | Read a local JSON file, defaulting to the project catalog relative to the module, and validate it. No network access. |
| `validate_catalog(data)` | Validate required fields, values, canonical identities, normalization, null inventories and evidence; raise `CatalogError` on failure. |
| `matching.engine.validate_requirements(dict)` | Reject malformed/unsupported inputs and return normalized requirements. |
| `match_program(program, requirements)` | Validate one trusted catalog record and the request, then return one structured decision. |
| `match_catalog(catalog, requirements)` | Validate the catalog/request, return all real entries ordered by eligibility and then transparent topic score. |
| `matching.coverage.build_coverage(catalog, themes)` | Count distinct program IDs by published grade and separately curated editorial theme; retain evidence and exclude uncertainty. |
| `python -m matching.audit` | Reproduce catalog integrity, pilot fingerprints, coverage and five actual deterministic examples. |

The original dataset's stable `id` is exposed as `program_id` in results. No catalog schema migration was needed. `data/program_themes.json` and `data/coverage.json` are separate additions.

## Catalog and evidence validation

All original program keys are required, including nested price/duration fields. Unknown values must be JSON null and have an exact JSON Pointer in `unknown_fields`, a reason and next action. Empty strings/arrays do not replace missing facts.

Validate unique IDs and normalized official URLs, source URL/program consistency, source dates, resolvable field pointers and source IDs, allowed evidence statuses, finite nonnegative prices, positive integer minutes, grade normalization and published-unit conversions. The loader also rejects duplicate JSON object keys and nonfinite JSON numbers.

Evidence inheritance uses the most specific pointer: for example, `/price` supports its numeric amount, while `/price/currency_code` overrides it as unknown. A populated field marked pending or conflicting is not used as verified evidence. Structural validation cannot independently prove a curator's transcription against a live page; the research ledger records the manual source review.

## Input contract

```json
{
  "grades": [4],
  "student_count": 24,
  "max_program_fee": 400,
  "budget_currency": "USD",
  "assume_usd": true,
  "max_duration_minutes": 90,
  "preferences": ["force and motion"],
  "mandatory_operational": {},
  "required_standards": []
}
```

- `grades` is required: one concrete grade or a nonempty list. Accepted aliases are PreK/pre-k, K/Kindergarten, integer -1/0 for PreK/K, or grades 1–12 as integers or numeric strings. Booleans, fractional grades and ambiguous request token “7+” are rejected. The product audience remains Grades 2–7; accepting a wider concrete grade domain is a utility boundary, not an expanded product promise.
- Published `7+` supports concrete Grade 7 and higher within the accepted input domain. The API's Grade 12 input ceiling is not a claimed museum upper grade limit. No published grade range is expanded on the basis of subject appeal.
- A mixed-grade request creates a check for every distinct grade; all must be supported to pass.
- `student_count` is optional for grade-only matching but must be a positive integer when provided. A fee budget or mandatory capacity requires it.
- Optional budget must be finite, nonnegative and have at most two decimal places. Currency is an uppercase three-letter code or null; an unsupported but syntactically valid currency produces an unknown comparison, not conversion.
- Optional duration must be a finite positive number of minutes, at most 1,440. This is an input sanity limit for workshop planning.
- Preferences and required standards are lists of nonempty strings. Standards match exact published codes only; absence of a code is unknown, not proof of non-alignment.
- Mandatory operational keys: `capacity: true`, `availability: "YYYY-MM-DD"`, `accessibility: "required accommodation"`, `special_delivery: "required arrangement"`, `additional_charges: true`, `booking_conditions: true`. Invalid dates, false/nonconforming requirement values and unknown keys are rejected. Omit a key when it is not mandatory.
- The engine rejects unexpected input fields, including attempted eligibility overrides.

## Eligibility and failure precedence

Every applicable check retains status, reason, evidence, and any currency assumption.

1. Any verified violation → **fail**, regardless of another unknown.
2. Otherwise, any unresolved applicable hard requirement → **unknown**.
3. Otherwise → **pass**, subject to a clearly disclosed permitted application assumption.

Grade checks are always applicable. Fee and time limits apply only when requested. Missing duration alone does not block a request without a duration limit; missing price alone does not block a request without a budget. Missing curriculum standards do not block ordinary matching.

Result `classification` is `eligible` for an unconditional program-eligibility pass, `conditional` for a pass relying on a disclosed currency assumption, `unknown`, or `rejected`. Even an unconditional eligibility pass is not a confirmed booking.

## Fees and the USD application assumption

Preserve original published price labels, amounts, per-student basis and null ISO codes. Use `Decimal` for amount × positive integer student count; serialize monetary subtotals as exact decimal strings such as `"336.00"`.

An explicitly verified source currency may be used directly. Otherwise, `assume_usd=true` permits interpretation of a verified published $ symbol as USD with the disclosure: “USD assumed for this Connecticut prototype; not explicitly published by the museum.” It does not update `price.currency_code`. The same explicit assumption can supply an omitted budget currency.

Without a supported currency interpretation, no authoritative subtotal is returned. With the USD assumption and an incompatible EUR/CAD budget, a USD program-fee subtotal may be shown, but the budget constraint is **unknown**; no exchange-rate calculation occurs. No currency mismatch can hide a verified grade/time failure.

Additional trip costs and total trip cost remain null. No transportation, meals, taxes, discounts, extra-session multipliers or binding quotes are invented. Resourceful Schools retains its published 120-minute/$18 fields and a warning about the two-session recommendation.

This implements the latest PRD and supersedes the older dictionary's conservative application policy requiring currency clarification for every comparison; the older source finding that ISO codes are unpublished remains correct.

## Operational confirmation

Always return six operational items: capacity, availability, accessibility, special delivery, additional charges and booking conditions. Their status remains `requires_confirmation`, and `booking_confirmed` is always false. Published details do not establish a transaction or actual availability.

When an item is mandatory, its validation also participates in overall eligibility. Capacity uses verified minimum/maximum limits: a known violated bound fails even if the other bound is unknown; both verified bounds satisfied can pass the capacity check. Otherwise it is unknown. Test-only synthetic capacity fixtures exercise this logic; actual catalog capacity fields remain null.

The existing schema contains no structured date-specific or accommodation-specific confirmation evidence. Free-text notes cannot establish those requirements automatically; mandatory availability, access, delivery, additional-charge and booking-condition requests remain unknown. This deliberately avoids inventing booking functionality.

## Transparent learning-topic baseline

For each unique preference, lowercase and tokenize into alphanumeric words. A preference matches if all its words occur in a single verified name, subject label or factual description. Each matched preference contributes exactly one point, independent of how many fields match. Output preserves the matching fields, text and evidence.

There are no embeddings, synonym expansion, language-model rankings or inferred standards. This baseline can miss synonyms and is not a measure of educational quality. Editorial coverage themes do not overwrite published subjects or drive hidden ranking.

Sort all catalog results with pass first, unknown second, fail last; within each status sort by descending topic score, then stable ID. Soft scores never turn a hard failure into a recommendation. Callers may select up to three eligible entries, but the engine returns all evidence-bearing results and never pads an empty or small shortlist.

## Output contract

Each result includes `program_id`, official name/URL, eligibility status, classification, individual hard checks, published fee metadata, calculated subtotal and currency disclosure, duration and requested-limit status, matched preferences/subjects, topic score, source evidence, operational confirmation items, failure/unknown reasons, and data-quality warnings. No model-generated program records or unverified costs are returned.

See [matching_demonstrations.json](../artifacts/matching_demonstrations.json) for actual results and [README usage](../README.md) for a runnable example.

## Future agent boundaries

Stage 3 may wrap `load_catalog()`, `match_catalog()` and `match_program()` as read-only tools bound to the approved local catalog. Bind paths and program IDs in trusted backend code; do not let model/user content supply arbitrary filesystem paths or replace catalog objects. Coverage can be exposed through the validated local coverage artifact.

Agents may explain returned results and later propose educational activities. They may not modify published grades, prices, durations, standards, source evidence, currency assumptions without disclosure, hard-check results or failure precedence. They cannot certify booking, capacity or accommodations from missing evidence. Validate any future model-selected IDs and claims against these tools after generation. No such agent integration exists in Stage 2.
