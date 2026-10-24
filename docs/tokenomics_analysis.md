# Tokenomics — observed usage, controlled comparison and pricing limits

October 23, 2026. This evidence concerns course `gpt-6-luna` through `https://api.portkey.ai/v1/chat/completions`, using the unchanged production connection and `reasoning_effort=none`. Every new response reported `gpt-6-luna-2026-09-22`. Public-price calculations below are **illustrative commercial token costs, not course gateway charges or an invoice**.

## Historical audit before new inference

[Usage audit](../artifacts/stage5/usage_audit.json) recomputes totals from individual HTTP records and deduplicates exported runs by run ID. Cached reads are part of input, not additional tokens. Historical cache writes and provider response IDs were not retained and remain null.

| Population | Input | Cached read | Output | Responded HTTP requests | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Stage 3 Case A Advisor | 5,127 | 0 | 355 | 2 | Passed |
| Stage 3 Case A Designer | 4,403 | 0 | 772 | 2 | Passed historically |
| Stage 3 Case A complete | 9,530 | 0 | 1,127 | 4 | Explicit teacher-selected Catapult; 19.811s summed agent time |
| All seven responded Stage 3 attempts | 44,721 | 13,512 | 1,816 | 17 | Five passed, two rejected |
| Stage 4 successful browser pair | 9,708 | 0 | 1,242 | 4 | Passed; 2.558s summed agent time |
| Stage 4 including initial rejected Designer pair | 19,416 | 0 | 2,484 | 8 | Three agent runs passed, one rejected |

Stage 3's earlier sandbox smoke recorded one outbound attempt with no provider response and null usage. It is excluded from observed-token totals. The three Case C artifacts have distinct run IDs/timestamps and are separate live attempts, including diagnosis and final retry. They are not counted once merely because usage is identical. Their upstream response identity cannot be recovered. Stage 4.1–4.4 replays, FunctionModel responses and local validator re-executions add no live usage. Historical failures remain unchanged in their original receipts.

## Paired Advisor experiment

Protocol was frozen before execution; see [methodology](evaluation_methodology.md). The evaluation-only adapter changes the membership of `search_matching_programs` results. Full supplies all 20 records using the same compact fields as production; Shortlist supplies all nonfailed candidates. It is not a comparison with the complete archival JSON byte-for-byte. No new top-k ranking is introduced. Both conditions retain on-demand details/evidence tools, the same instructions/schema/validators/settings and three-request cap.

| Scenario / condition | Candidates | Input | Cached read | Cache writes | Output | Requests | Seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Grade 4 forces — Full | 20 | 6,069 | 0 | 5,253 | 347 | 2 | 6.166 |
| Grade 4 forces — Shortlist | 16 | 5,103 | 0 | 4,287 | 381 | 2 | 3.048 |
| Grade 5 wind — Full | 20 | 6,074 | 0 | 5,259 | 167 | 2 | 2.258 |
| Grade 5 wind — Shortlist | 16 | 5,076 | 0 | 4,261 | 169 | 2 | 5.625 |
| Grade 2 geometry — Full | 20 | 6,160 | 0 | 5,344 | 154 | 2 | 3.088 |
| Grade 2 geometry — Shortlist | 4 | 2,337 | 0 | 1,521 | 156 | 2 | 2.578 |

All six Advisors returned accepted structured results and actually called the matching tool. Totals: Full **18,303 input / 668 output**, Shortlist **12,516 input / 706 output**, six HTTP requests each. Input reduction is **31.62% across these three tasks**, with a larger effect for Grade 2's smaller eligible set. Output increased by 38 tokens. At the illustrative rates below, total Advisor costs are $0.002560700 versus $0.001856325: **27.51% lower** under that explicit charging assumption. These are not measured course-credit savings or a statistical estimate for all teachers.

Median Advisor latency was 3.088s Full versus 3.048s Shortlist. One Shortlist run was slower. Repeated first-round provider response IDs occur across paired identical prompts: 14 actual gateway requests in the complete batch correspond to 11 distinct response IDs. This is consistent with response reuse but does not establish its billing treatment. Transaction usage and deduplicated response usage are recorded separately. No cache headers, billing records or hidden provider computation are inferred. Latencies include possible reuse and should not be claimed as fresh-model processing benchmarks.

### Quality and failed complete-workflow extension

Accepted choices: 10/10 genuine IDs with correct eligibility labels; 20/20 source pointers resolve; 70/70 authoritative field/subtotal checks agree; 60/60 operational warnings remain. The 70 checks are seven fields for ten choices, and the 60 warnings are six items for each choice; they are not independent user trials. These machine checks **did not catch one incorrect prose fact**: Full Grade 4 Catapult reasoning called its projectile a marble, contrary to the supplied ping-pong-ball description. This is an important residual safety/factual defect, preserved in the raw output and [quality audit](../artifacts/stage5/quality_review.json). Shortlist introduced no identified prose factual error in this sample. Both wind and geometry pairs returned one relevant option. Grade 4 choice sets differed (Simple Machines versus Wind Power), although both remained eligible. The filter itself removed no eligible/unknown option; educational ranking can still omit useful options such as Solar Sunflower.

No quality degradation was observed for Shortlist relative to Full in these three inspected Advisor scenarios, but this is a narrow internal assessment. It neither proves semantic accuracy nor establishes that the optimization never reduces quality. Ratings are assistant qualitative review, not educator feedback.

The user explicitly selected **Marble Roller Coaster** for both optional Designer tests. The first Designer used two real requests, 4,569 input, 0 cached read, 3,355 cache-write and 921 output tokens, taking 9.384s. It was rejected by the existing empirical-evidence guard, which misread a prohibition against filling gaps with invented measurements. The plan was not returned as accepted. Further inference stopped; the Shortlist Designer was not executed. Thus **no successful new paired two-agent comparison is claimed**. The failed Full attempt cost four requests, 10,638 input and 1,268 output across its two agents; its illustrative attempt cost is $0.001913, not a cost per successful workflow. This known limitation is not repaired by weakening the production validator during evaluation.

### Exact new usage and bounds

**14 of at most 24 requests used; zero automatic retries.** Seven agent attempts: six passed independent validation, one failed. Across actual gateway transactions: **35,388 input, 0 cached read, 29,280 cache-write, 2,295 output**. Distinct response IDs account for 33,319 input and 2,250 output; the difference represents repeated response payload IDs, not validator-only replay. All 14 outbound requests remain documented. Illustrative transaction-based total: **$0.0054183**; actual course debit is unknown. Raw traces contain provider response IDs, actual tool activity and exact usage. No credentials, capabilities or HTTP headers are exported.

## Pricing and cache accounting

[Official model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna), accessed October 23, lists Standard USD per million: ordinary input **$0.10**, cached read **$0.01**, cache writes **$0.125**, output **$0.50**. The [official caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) subtracts both cached reads and writes from total input before charging ordinary input. New gateway responses report `prompt_tokens_details.cache_write_tokens`; these values were actually captured, not assumed. Historical missing writes remain unknown.

For disjoint input classes, `cost = ((I − C − W) × 0.10 + C × 0.01 + W × 0.125 + O × 0.50) / 1,000,000`. Assert `0 ≤ C + W ≤ I`. Missing historical W gives a range from W=0 to W=I−C, not a fabricated observed zero. These are Standard illustrative rates without regional/service-tier premiums. The reviewed course assignment and public pricing sources do not establish course credit accounting, gateway markup/cache charging, free-credit treatment or user out-of-pocket expense. Confirm those with course staff or an authorized billing statement before asserting actual charges.

## Complete-workflow monthly projections

Use the most recent successful **Stage 4 browser pair**, not the rejected new Designer, as a transparent example workflow: 9,708 input, 0 cached reads, 1,242 output, four requests. Cache writes were not retained; illustrative token cost is **$0.0015918–$0.0018345 per completed example**. This one observation is not an estimated population average. [Cost model CSV](../artifacts/stage5/cost_model.csv) includes both historical successful baselines, all assumptions and unrounded calculation results.

| Users | Workflows per user/month | Total workflows | Illustrative monthly token cost, USD |
| --- | ---: | ---: | ---: |
| 1 | 1 | 1 | $0.0015918–$0.0018345 |
| 1 | 3 | 3 | $0.0047754–$0.0055035 |
| 100 | 1 | 100 | $0.15918–$0.18345 |
| 100 | 3 | 300 | $0.47754–$0.55035 |
| 10,000 | 1 | 10,000 | $15.918–$18.345 |
| 10,000 | 3 | 30,000 | $47.754–$55.035 |

These are extrapolations, excluding hosting, engineering, support, availability, gateway fees and failure/retry overhead. The initial Stage 4 failed pair used the same tokens as its successful retry, so that observed retry sequence doubled reported transaction usage for that successful delivery. This is an example, not an estimated universal failure rate. A hypothetical 10% extra identical-workflow workload multiplies the table by 1.10; that percentage is a sensitivity assumption, not observed deployment behavior. More calls, longer outputs and repeated attempts raise cost. No complete Full-vs-Shortlist savings percentage is justified because the new Designer pair did not complete.

## Implemented cost controls and reproduction

`backend/agents.py` filters failed candidates and bounds actual tools (six / 24,000 bytes). `backend/config.py`, `gateway.py` and `service.py` enforce production four requests per agent, 70,000-byte request, 2,400 output tokens per response, 90s agent/30s HTTP timeouts, cumulative reported-usage guards and zero SDK/output retries. Human selection separates the two agents. Tool rounds count as requests; one agent is not one billable request. The production shortlist is all nonfailed records, sometimes 16, not always three.

Frontend tests verify that navigation, Quick Start, editing, printing and draft saving/restoration do not call recommend/journey. `tests/test_backend.py`, `tests/test_gateway.py` and draft tests passed again. The evaluation `Budget` lock/counter rejects request 25 and stops a per-agent fourth request; the transport and production guards remain active. No model call is required to reproduce offline summaries:

```sh
.venv/bin/python -m evaluation.audit_usage
.venv/bin/python -m evaluation.summarize
.venv/bin/python -m evaluation.verify
```

The live harness requires `--live`, refuses overwriting an existing attempt, and shares the persisted 24-request budget. It is intentionally not a one-command automatic paid rerun. Any further experiment should be separately reviewed, with new evidence paths and a new explicit budget; do not delete evidence to bypass the cap. No additional inference is authorized by these reproduction notes.
