# Stage 5A–5B evaluation protocol

Defined October 23, 2026, before the new scenario executions and paired model experiment. The approved checkpoint is `a9ea536ad369fcd3f5abcc63dc0fe7edc3611232`. No product behavior is changed for evaluation. The historical PRD's old stage labels are historical; its amended eligibility policy remains authoritative.

## Purpose and ground truth

The [official assignment](https://zlisto.github.io/mgt_409_fa26/project_requirements.html), reviewed October 23, assigns 21 points to novelty/value, 30 to the app, 41 to the report, and 8 to slides. Agent Design (10), Tokenomics (8), Safety (8), and Impact (5) require inspectable evidence. Tier 2 calls for thoughtful integration and measured evidence; Tier 3 additionally needs demonstrated value to real people. Passing technical tests alone establishes neither user time savings nor student learning.

Freeze [24 scenarios](../artifacts/stage5/evaluation_scenarios.json) before execution. Expected decisions are independently specified from the catalog's published grades, nulls, $14 × 24 = $336 arithmetic, duration and the approved failure precedence. Catalog facts and field evidence are included in the specification. Preserve its SHA-256 with results. Failed expectations remain failures; repairs, if necessary, require a separate explanation and rerun artifact.

Reuse the actual `matching` functions, backend validators and existing FunctionModel test fixtures. Simulated output tests execute real registered tools and service validation, but are not evidence of model intelligence or billed usage. Input-validation checks make no agent call. The saved-draft scenario combines expired backend authorization with the existing offline frontend tests. Historical browser runs are cited as historical, not rerun silently. No paid call is needed for these 24 scenarios.

## Separate metrics and denominators

| Dimension | Calculation and scope |
| --- | --- |
| Scenario success | Expected outcome reached / 24 predefined scenarios; includes expected rejection |
| Tested eligibility accuracy | Correct target decisions / specified target program decisions in A01–A06, B07–B10, C13–C16; B07 checks all 20 |
| Constraint enforcement | Successful explicit grade, budget, duration or mandatory-unknown assertions / those explicit assertions; do not count unasserted fields |
| Accepted-choice hard-constraint compliance | Nonfailed choices with correct eligible/provisional label / all accepted choices; keep mocked and live populations separate |
| ID and source integrity | Invalid IDs and invalid evidence references in accepted outputs / all inspected accepted choices and references, respectively |
| Factual accuracy | Field-by-field name, URL, fee, subtotal, duration and standards agreement with catalog/matcher; free prose assessed separately, not proved by schema |
| Uncertainty disclosure | Present applicable mandatory-unknown and operational warnings / required warnings checked; distinguish warning retention from model prose explanation |
| Workflow completion | Successful complete two-agent workflows / initiated complete workflows; report model-only, historical browser, and human study separately |
| Safety | Expected safe outcomes / specified adversarial or malfunction cases; no claim of general attack resistance |
| Latency | Median and range of measured agent latencies, plus summed two-agent time; excludes teacher decision time and is not human task time |

No blended overall quality score. Report both numerators and denominators. New live experiment metrics use their own sample, not 24 simulated cases. Counts of rejected fabricated claims are not accepted factual-error counts.

## Instructional-quality review rubric

Inspect actual saved outputs before assigning any rating. Internal assistant review is labeled **assistant qualitative audit**, not an independent educator, project-author or user-study rating. Each 1–5 dimension has anchors: 1 = absent/misleading; 2 = weak/generic; 3 = plausible but uneven; 4 = specific/useful with minor gaps; 5 = consistently specific, actionable and well differentiated. Rate learning-goal alignment, reasoning specificity, and comparison clarity separately. Record factual errors and uncertainty omissions separately with examples.

For journeys, inspect age appropriateness, workshop specificity, three-phase coherence, objective/assessment alignment, predictions versus actual observations, practicality and separation of official facts from suggestions. Preserve unsuccessful examples, including the historical hypothetical-observation exercise and validator false positives. No rating demonstrates effectiveness in a classroom.

## Prespecified paired context experiment and spending bound

Three tasks: Grade 4 force/motion, Grade 5 renewable energy, Grade 2 geometry/design; 24 students, $400 USD with explicit assumption, 90 minutes in each. Full versus shortlist order alternates full/short, short/full, full/short. One observation per cell, no statistical significance claim. Same course `gpt-6-luna`, gateway, production agent builders/instructions, output schemas, tools, independent validators and settings. No temperature/seed change. Sampling and gateway caching may vary.

Full condition supplies **all 20 catalog records using the production compact factual projection**, not every byte of the archival JSON. Shortlist uses the unchanged production filter: all nonfailed candidates, not an invented top-three cutoff. Both use identical per-record fields; detail/evidence tools remain available. An evaluation-only tool-result adapter varies only membership. Initial measured context sizes: Grade 4 full 21,815 bytes vs shortlist 17,219 (16 records); Grade 5 full 21,859 vs 17,116 (16); Grade 2 full 22,361 vs 4,305 (4). Exact executed sizes are retained. This estimates pruning of catalog coverage, not an optimization against unbounded raw catalog dumping. No eligible/unknown program is removed by this filter.

Batch cap: **24 outbound model requests total**, persisted across invocations; **3 requests per agent**, 6 registered tool calls, 90-second agent/30-second HTTP timeout, 24,000-byte tool output and 70,000-byte HTTP request bounds, 2,400 output tokens per response, zero automatic retries. Production cumulative 32,000 input/6,500 output usage guards also apply; reported-token guards may overshoot by one response. Six Advisors allow at most 18 requests, and an optional human-selected pair of Designers at most six. No fallback or automatic rerun. A failed service attempt is retained and consumes the applicable reservation. The global budget uses a process lock and persistent counter.

Historical successful Advisor/Designer evidence suggests approximately two requests and roughly 5,000/4,500 input tokens per role: eight agent runs would therefore be about **16 requests, 39,000 input tokens and 4,200 output tokens**, before full-context differences. These are planning estimates, not measurements. The transport-byte upper bound is 24 × 70,000 bytes, and the completion ceiling is 24 × 2,400 = 57,600 output tokens; byte counts are not exact token counts. Stop on provider unavailability, cap or unexplained failure rather than retrying expensively.

Advisor results must be reviewed before requesting explicit teacher selection for the optional Designer pair. No fake workflow capability is created. A harness-only selection records user consent, verifies membership and eligibility again, and invokes only the selected-program tool. It does not authorize any server workflow. Analyze cost and quality jointly, including failures, model requests, uncertainty, missed relevant choices and provider-reported cache values.

## Impact and pricing boundaries

The user study is pending until a consented participant actually completes it. Website-selection tasks are compared fairly; additional plan generation is scored separately. Browser automation latency is not educator time savings. Course credit rates and out-of-pocket charges require authoritative confirmation. Public model list prices, if verified, support only explicitly illustrative commercial calculations. Unreported cache writes remain null; provide a range if they affect price. No invented billing value fills a missing rate.
