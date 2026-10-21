# Whitney Learning Compass — From Curriculum Goals to Hands-On Discovery

**Stage:** 1 — Project Scope and Data Foundation  
**Prepared:** October 21, 2026 (America/New_York)  
**Stage 1.1 amendment:** October 21, 2026 (America/New_York) — Scope Refinement & Documentation Cleanup  
**Status:** Documentation refinements for review; implementation and Stage 2 have not started.

## Product and users

**Value proposition:** Help educators turn curriculum goals and practical constraints into evidence-backed Eli Whitney Museum & Workshop program choices and a coherent before–during–after learning journey.

Primary users are classroom teachers and other educators, initially planning for **Grades 2–7** at the Eli Whitney Museum & Workshop in Hamden, Connecticut. A multi-grade class must be eligible as a whole. Preserve programs' broader published grade labels without expanding the product's initial audience.

This is an **independent MGT 409 educational prototype using public museum information**, not an official museum product or an endorsed booking service. The museum remains the authority on program delivery and booking.

## Problem and intended outcome

Teachers must connect instructional goals to an appropriate hands-on program while checking grade eligibility, session length, program fees, group needs, and what remains unconfirmed. They also need to connect the visit to classroom preparation and reflection. A useful assistant makes the evidence and uncertainties visible and keeps the educator in control of the final choice.

The initial catalog will be a deliberately curated selection of **20 real school programs**, not a representation of the entire museum catalog. Stage 1 contains five pilot records and a separate 15-program research backlog.

## Four core capabilities (future implementation)

1. **Teacher needs intake.** Collect grade(s), learning goals, subjects, optional standards, student count, available workshop time, program-fee budget and its currency, and relevant access or group requirements. Distinguish required conditions from preferences; ask for a missing required input instead of assuming it.
2. **Verified program matching and comparison.** Match only catalog IDs, validate hard constraints in deterministic tools, and show an evidence-linked comparison of eligible options, educational fit, published fees, duration, and unknowns. Show program eligibility separately from booking and operational items requiring confirmation.
3. **Personalized learning journey generation.** After the teacher selects a validated program, draft a structured before–during–after plan with objectives, preparation, inquiry prompts, reflection, assessment evidence, and editable timing/materials. Label generated classroom suggestions separately from museum-published program facts. Do not prescribe changes to the museum's workshop or promise a particular delivery.
4. **Evidence-based review/export.** Show source links, verification dates, constraint-check results, assumptions, and unresolved questions before a teacher exports the recommendation/plan. Validate output structure and catalog references outside the model; label generated content and the independent-prototype status.

## Distinctive contribution

**Whitney Learning Compass is an evidence-grounded curriculum-to-workshop decision assistant, not a generic chatbot, course search engine, or field-trip logistics planner.**

| Named reference product / official source | Relevant existing capability | Proposed Whitney Learning Compass distinction |
| --- | --- | --- |
| [Eli Whitney Museum & Workshop — Official School Programs Catalog](https://www.eliwhitney.org/workshop/school-programs) | Published program descriptions and filters by grade, subject, Next Gen Standard and keyword. | Goal-driven recommendations across multiple constraints, explainable comparisons, and an integrated before–during–after learning journey. |
| [MagicSchool AI — Lesson Plan Generator](https://www.magicschool.ai/tools/lesson-plan) | AI teaching assistance, including lesson-plan drafts using grade, subject, standards, instructional goals and available time. | Ground learning plans in verified museum-specific programs, with source evidence and deterministic eligibility validation. |
| [TripSlip](https://trytripslip.com/) | Field-trip administration and logistics; its official site describes venue booking, parent communication, permission slips and payment collection. | Focus on educational fit, evidence-based program selection and curriculum integration; booking administration remains outside this prototype's scope. |

Official descriptions reviewed October 21, 2026. These are category comparisons, not exhaustive feature audits; no absence of a competitor feature or measured superiority is asserted.

The proposed innovation is primarily the integration of program discovery, deterministic constraint validation, educational reasoning, learning-journey creation and evidence-based review into one museum-specific workflow. This positioning will support the Final Project's Motivation and What's New sections; it makes no “world's first” claim.

## Functional requirements

- Use a versioned local curated catalog with stable project IDs, exact official names/URLs, field-level evidence, verification dates, and explicit missing values.
- Preserve original museum grade/subject labels. Normalize only through documented rules. Preserve the meaning of “7+”; do not invent a maximum age/grade.
- Require student count to be a positive integer before calculating class program fees. Validate grade eligibility, monetary units, duration, and missing values outside either agent.
- Apply the two-layer policy below: aggregate applicable hard constraints with `fail` taking precedence over `unknown`, and keep operational confirmation visible separately. Missing operational information affects eligibility only when it is an explicit mandatory requirement.
- Rank educational preferences only after evaluating hard constraints. Explain which preferences are supported by published subjects/descriptions and which are generated interpretations.
- Support comparisons using the same units and evidence fields; never substitute a model-created program, price, duration, or standards code.
- Identify published prices as **per-student program fees**. A class program-fee subtotal is not a total field-trip estimate. Transportation, meals, other charges, scheduling, and actual availability require separate evidence or user inputs.
- Treat absence of a published standards code as unknown, not evidence that a program lacks standards alignment. A model-suggested alignment must be labeled as a proposal.
- Minimize personal data: class-level requirements are sufficient; do not request student names, records, or diagnoses.
- Prevent source text or user prompts from overriding catalog validation, model restrictions, credential controls, or evidence requirements.

## Program eligibility and operational confirmation

### Layer 1: Program Eligibility

Determine whether the program satisfies the teacher's applicable hard requirements using verified catalog facts and deterministic validation. Check every grade in a mixed-grade class, published per-student fees and calculated class program fees, published duration, and other explicitly specified, verifiable hard requirements. Educational preferences help rank suitable candidates; they do not override a hard constraint.

| Overall eligibility | Aggregation rule |
| --- | --- |
| `pass` | All applicable eligibility constraints are verified and satisfied, with any permitted application currency assumption disclosed as described below. |
| `fail` | At least one verified hard constraint is violated, even if another required field is unknown. |
| `unknown` | No verified hard constraint fails, but at least one applicable required field remains unverified. |

Evaluate verified failures first, then unresolved mandatory requirements, then pass. Retain each individual check and its evidence so the overall result can be explained.

### Layer 2: Booking and Operational Confirmation

Separately display items requiring museum confirmation: actual availability on the requested date, group capacity, accessibility accommodations, special delivery arrangements, and additional charges or booking conditions. Missing operational information does not automatically disqualify an otherwise eligible program when the teacher has not made that information mandatory.

If the teacher specifies a mandatory accessibility, capacity, date or other operational requirement, evaluate it as an applicable hard constraint as well: unverifiable means `unknown`, verified incompatibility means `fail`. Student count used for fee arithmetic does not itself establish or certify museum capacity. Program eligibility must never imply confirmed bookability.

**Illustrative policy example, not an executed application result:** For Grade 4, 24 students, a $400 program-fee budget and a 90-minute workshop limit, the existing [Catapult record](../data/programs.json) supports grade compatibility, 24 × $14 = **$336**, and a 90-minute duration. Eligibility can be `pass` under the explicitly labeled USD assumption, while capacity and actual booking availability remain unconfirmed. If verified capacity for 24 students is explicitly mandatory and cannot be established, eligibility is `unknown`; any verified hard failure would still take precedence.

### Currency assumption and source evidence

Preserve the museum's original `$` symbols, published fee labels, and amounts. For this initial Connecticut-based prototype, the application may interpret them as USD **only with a visible “USD assumed for this prototype; not explicitly published by the museum” label**. Use this same disclosed basis for the teacher's compatible program-fee budget and derived subtotal, and identify any resulting budget pass as conditional on that assumption. This does not verify a museum-published ISO code or authorize filling the catalog's null `currency_code`.

Never silently convert currencies or label an unsupported currency comparison verified. If the teacher's budget uses another or unresolved currency, or requires explicit museum confirmation of currency, the budget check remains `unknown` until supported. Keep program-fee arithmetic separate from additional charges and total trip costs.

This Stage 1.1 application policy refines the earlier conservative currency-planning language in the unchanged Stage 1 data dictionary, dataset follow-up notes and validation receipt. Their recorded source facts and null currency codes remain valid and unchanged.

## Non-goals and stage boundaries

Stage 1 creates scope documents, a data dictionary, five researched JSON records, a research plan for 15 more programs, and a validation receipt. It does not implement or run agents, matching tools, an API, a frontend, a scraper, or model calls. Stage 2 has not begun.

The product is not a booking/payment system, availability checker, route planner, transport quote service, comprehensive museum directory, official standards certification tool, or substitute for museum confirmation of accommodations or safety arrangements. It will not import Campus Customs business logic or reuse its workflows.

Do not create `report.html` or `slides.html` yet. They are eventual Final Project deliverables, to be supported by actual implementation and evaluation evidence.

## Intended architecture (design only)

| Component | Responsibility and boundary |
| --- | --- |
| **PydanticAI Agent 1 — Program Advisor** | Convert teacher goals into structured needs; call deterministic catalog/matching tools; explain and compare returned catalog entries with evidence. It cannot decide eligibility, invent entries, or calculate authoritative costs itself. |
| **PydanticAI Agent 2 — Learning Journey Designer** | Consume validated needs and the teacher's selected catalog entry; draft a structured before–during–after journey. It cannot rewrite catalog facts or bypass unresolved hard constraints. |
| Deterministic tools and validators | Load/validate the curated JSON; normalize intake; check every requested grade, fee arithmetic, time and missing values; rank transparent preference signals; check IDs, citations and output schemas. Final validation occurs after model output as well. |
| FastAPI backend | Own orchestration, validation, secure configuration, catalog access, and activity/usage records. Keep secrets server-side. |
| React / Vite / TypeScript frontend | Present intake, comparison, selection, plan review, evidence and export. Show unknowns alongside the affected choice. |

Intended flow: intake → deterministic checks → Advisor comparison → educator selection → Journey Designer → deterministic review → educator review/export. These are exactly two specialized agents; review and calculation are tools/validators.

### Course, configuration, and reproducibility constraints

- Actual future model calls must use the course **`PORTKEY_API_KEY`** and **only `gpt-6-luna`**. No fallback models or direct-provider credential path.
- Never hard-code or commit API keys. The future backend must load `.env` from the project folder or its parent, using explicit precedence: existing process environment, project `.env`, then parent `.env` for still-missing values. Never override a previously selected value. Reject conflicting/invalid configuration clearly without displaying secrets.
- At implementation time, provide a credential-free `.env.example`, secret exclusions, dependency lockfiles, documented runtime versions and setup/start commands, the checked-in catalog, and a readable missing-key error. The grader must be able to run the final app from a fresh GitHub clone after providing the course key.
- Record **actual** run IDs, agent actions, tool names/arguments/results, validation failures, latency, and provider-reported token usage/model identity. Redact secrets and minimize retained teacher input. Record unavailable usage as null; never estimate it and label it observed.
- Preserve actual safety-test cases/results and evaluation inputs, rubrics, outputs, dates and model/configuration versions for the Final Project report. Distinguish planned tests from executed results. No fabricated demonstrations, user feedback, or educational-impact measurements.

## Planned User Evaluation & Impact Measurement

**Proposed design only; no user evaluation or impact measurement has been performed.** If available, recruit at least one actual educator or relevant prospective user to complete a small paired planning evaluation.

- **Baseline:** Use the Eli Whitney Museum & Workshop's existing school-program website to select a suitable program and prepare a before–during–after learning plan.
- **AI-assisted:** Use Whitney Learning Compass for a comparable planning task and the same required deliverables.

Use two distinct tasks matched as reasonably as possible on grade, curriculum goals, constraints and expected plan detail, with the same time allowance and review rubric. Record prior familiarity and assistance received. Randomize task/approach order for a single participant; counterbalance across participants if more are available. Different tasks and ordering reduce, but cannot eliminate, learning effects.

| Measure | Planned collection |
| --- | --- |
| Actual task completion time | Record start/end times through completion of the reviewed deliverable; log interruptions, incomplete tasks and correction time. |
| Eligibility and constraint accuracy | Check the selected program against an independently prepared, source-backed answer key, including mixed grades, fee arithmetic, duration, unknowns and failure precedence. |
| Unsupported facts or human corrections | Count and describe unsupported claims, factual errors and corrections needed in each output. |
| Plan completeness and usefulness | Apply the same checklist for all three phases, objectives, activities and assessment evidence; ask the user to rate usefulness on a defined 1–5 scale with reasons. |
| Practical value, usability and limitations | Collect actual feedback with the same prompts for both approaches; retain permissioned notes and report limitations and negative feedback as well as benefits. |

Report paired observations and task details, acknowledging small sample size, differing tasks, prior familiarity and learning effects. Do not generalize a small planning study to measured student learning impact. If no qualified real user is available before the deadline, state that limitation and use reproducible benchmark scenarios as supplementary technical evidence; they cannot substitute for observed user feedback or measured real-world impact.

Retain at least **20 evaluation scenarios**, including ordinary, conflicting, incomplete and adversarial requests. Preserve actual outputs, timings, correction records and rubric results only when the evaluation is run; do not invent feedback or impact figures.

### Planned Tokenomics comparison

**Future empirical experiment; no model calls, cost measurements or experiments in Stage 1.1.**

Compare **Full Catalog Context**, supplying the entire curated 20-program catalog for recommendation generation, with **Verified Shortlist Context**, using deterministic filtering/retrieval first and supplying only a small relevant candidate set. Keep the same scenarios, catalog version, model (`gpt-6-luna` through the course Portkey configuration), output requirements and settings; vary the context-selection approach. Apply the same final deterministic validators to both approaches. Document shortlist size/rules and include no-match, incomplete and adversarial cases so filtering losses are visible.

For each comparable run, record actual input tokens, actual cached input tokens if reported, actual output tokens, model-call count (including retries), end-to-end execution latency, recommendation correctness and validation results. Missing usage fields remain null, not zero. Record cache conditions and repeat runs where feasible to distinguish cache and latency effects.

Calculate cost from observed usage and documented, dated pricing applicable to the configured model/provider, with a source URL, units, currency and any relevant gateway charges. Distinguish calculated cost from a billed amount. Where cached tokens are included in total input, charge uncached and cached portions at their respective documented rates without double-counting; leave unsupported pricing/usage components unknown. Compare cost and output quality together, including missed eligible candidates and unsupported recommendations, rather than reporting token savings alone.

Then project costs for **1, 100 and 10,000 users** over a stated period using explicit assumptions about planning sessions per user, recommendation/journey calls, retries and cache reuse. Separate measured per-run inputs from assumed usage: projected cost = users × sessions per user × modeled session cost. Include the two-agent journey cost when projecting the full application, or label a projection recommendation-only; identify excluded hosting/operational costs. Label all scale projections as estimates, never observed deployment results.

## Risks and responses

| Risk | Response / remaining limitation |
| --- | --- |
| Published facts or prices become stale | Store review dates; manually recheck before later release/booking decisions. A review date is not a guarantee of future availability. |
| Incomplete or conflicting pages | Preserve evidence and nulls; record conflict resolution. A hard constraint depending on an unknown remains pending. |
| Hallucinated programs, prices or standards | Restrict references to catalog IDs; check facts, evidence and calculations after generation. |
| Generated teaching content appears museum-approved | Visibly separate official facts from generated suggestions; retain independent-prototype labeling. |
| Unsafe or unsuitable activity suggestions | Require educator review; do not infer accessibility or safety from program eligibility. Evaluate unsafe requests and scope violations before release. |
| Limited coverage biases recommendations | Disclose curated coverage and “no confirmed match”; do not claim the best choice across the entire museum catalog. |
| Budget misinterpretation | Label fee basis and currency uncertainty; keep travel/other expenses outside program-fee subtotals. |
| Privacy, credential exposure, prompt injection | Use class-level inputs, server-side secrets, redacted activity records and adversarial evaluation cases. |

## Measurable acceptance criteria

All criteria below are **acceptance targets**, not claimed product results.

### Stage 1 review gate

- Exactly five pilot records, one for each requested program, with unique IDs and official URLs.
- Every populated museum fact has a source reference; each normalized/derived field has a stated rule.
- All five live official detail pages reviewed on October 21, 2026; any remaining absent facts explicitly null with reasons.
- JSON parses; IDs/URLs are unique; evidence references resolve; grade and duration transformations and fee units are consistent.
- Exactly 15 distinct additional real catalog entries identified by official links; none inserted into the pilot dataset.
- Only the new project directory contains created/changed deliverables. No app implementation, model requests, `report.html`, or `slides.html`.

### Later implementation / evaluation gates (not executed)

- In a predefined set of at least 20 evaluation scenarios covering ordinary, conflicting, incomplete and adversarial requests, **100%** of recommended IDs resolve to reviewed catalog entries and **100%** of displayed factual claims have source support or explicit unknown labels.
- Deterministic fixtures accept **zero** known hard-constraint violations, treat **zero** missing monetary/time values as zero, and reproduce **100%** of independently calculated fee subtotals.
- Every accepted journey contains all three phases, observable learning objectives, assessment evidence, source references for museum facts, and explicit labels for generated suggestions.
- Each real model/agent run has an activity record and actual token usage or an explicit provider-usage-unavailable null.
- Safety cases cover fabricated program requests, unsupported facts/standards, source/user prompt injection, secret requests, unsafe activities and out-of-scope booking/cost claims; record actual outcomes and remediate failed release criteria.
- A clean-clone setup succeeds by following the eventual README with no repository secrets or undocumented machine-specific paths.

## Review decision

Review the scope, pilot records and unknowns before authorizing Stage 2. The expansion plan is a backlog only.

