# Stage 5A–5B validation — evaluation, impact preparation, tokenomics and safety

Executed October 23, 2026, against approved Stage 4.4 checkpoint `a9ea536ad369fcd3f5abcc63dc0fe7edc3611232` on `main`. This is an evidence-only stage. **No production source, catalog, agent, matcher, frontend, draft behavior or earlier evidence file was changed.**

## Official requirements and scope

The [official assignment](https://zlisto.github.io/mgt_409_fa26/project_requirements.html) was reviewed first, including its 100-point rubric, Tier 2/3 expectations and eight report sections. Agent design needs a genuine trace; Tokenomics needs measured usage and clear cost assumptions; Safety needs an executed defense; Impact needs credible real-world evidence. Unit tests alone do not establish educator benefit. The project scope and Stage 2–4.4 implementation/validation history were reviewed; historical stage labels were preserved.

## Predefined scenario evaluation

[Methodology](evaluation_methodology.md) and [24 expected scenarios](../artifacts/stage5/evaluation_scenarios.json) were written before their execution. The result records the exact scenario-file hash. Expected statuses use actual published grade labels, fee arithmetic, duration/nulls and failure precedence.

| Execution method | Scenario count | Final passed / failed |
| --- | ---: | ---: |
| Actual deterministic catalog/matching | 14 | 14 / 0 |
| Input validation without agent | 3 | 3 / 0 |
| Offline FunctionModel + real service/tools/validators | 5 | 5 / 0 |
| Isolated malicious source fixture | 1 | 1 / 0 |
| Offline expiry + frontend document-recovery tests | 1 | 1 / 0 |
| Total predefined suite | **24** | **24 / 0** |

These 24 use **zero live model calls**. Six new live Advisor cells and one new live Designer attempt are a separate experimental population, not silently added to the 24-success denominator.

Actual target-level metrics: **33/33** specified eligibility decisions correct (the low-budget case checks all 20 programs); **11/11** explicitly asserted hard-constraint checks correct; Catapult's **$336.00** independently verified. Twenty of the 33 decisions belong to one low-budget scenario, so this is not 33 independent teacher tasks. The fixture loop stops, budget override is rejected, and no test-generated fabricated program is accepted. Six D-category safety scenarios all reach their specified safe outcome; this is not general attack immunity.

The first run was **23/24**, with a harness KeyError in E24 caused by UUID-versus-string workflow indexing. The [first attempt](../artifacts/stage5/evaluation_attempt_1.json) is retained. A one-line harness correction preserved expected outcomes and production code; the final run passed. [Results](../artifacts/stage5/evaluation_results.json) retain actual decisions/errors/traces, and [CSV](../artifacts/stage5/evaluation_summary.csv) provides a compact index. E24 additionally reran all **13 DraftWorkflow tests**; it did not generate a new browser screenshot or paid request.

## Real model experiment and observed limitations

Historical usage was audited before new inference. All seven responded Stage 3 attempts total 44,721 input / 13,512 cached read / 1,816 output over 17 requests. All Stage 4 attempts total 19,416 input / 0 cached read / 2,484 output over eight requests. Historical local replay adds no provider use; the original failed smoke retains unknown usage. Distinct diagnostic attempts were not deduplicated solely on equal token totals.

The evaluation-only Full adapter sends all 20 programs in the existing compact representation. Shortlist uses unchanged deterministic filtering (16, 16, and 4 candidates). Instructions, tools, model, output schema and validators remain equivalent. Six Advisor cells all completed with real tool calls and accepted structured outputs. Full: **18,303 input / 668 output**; Shortlist: **12,516 input / 706 output**; six requests each, a **31.62% input reduction** in this sample. At explicit public-list assumptions, Advisor token cost decreases 27.51%. This is not a measured course bill or universal savings claim.

Independent structural audit: **10/10** IDs and eligibility labels valid, **20/20** evidence references resolve, **70/70** authoritative fact/subtotal checks agree, **60/60** operational warnings retained. Manual prose inspection found **one unsupported Catapult projectile substitution in the Full condition**, which the production validator accepted. Zero identified prose errors in the other five outputs is a limited assistant review, not proof of complete entailment. [Quality review](../artifacts/stage5/quality_review.json) records separate ratings and concrete reasons, including older successful and weak journey examples.

The user explicitly selected **Marble Roller Coaster** for the two optional Designer conditions. The Full Designer was rejected for a benign prohibition against invented observations: an existing heuristic false positive. Further inference stopped instead of spending on a repeated failure. **Shortlist Designer was not executed; no successful new paired complete workflow is claimed.** The historical Stage 4 genuine complete browser run supports the successful two-agent trace and projection baseline. The [safety report](safety_evaluation.md) documents both new defects without changing production behavior to improve the evidence.

New Stage 5 usage: **14 actual gateway requests**, seven agent attempts (six validated, one rejected), zero automatic retries; **35,388 input / 0 cached read / 29,280 cache-write / 2,295 output tokens**. The hard batch cap was 24. Eleven distinct provider response IDs are retained; repeated first-round IDs are separately deduplicated to 33,319 input / 2,250 output. Billing/cache treatment of response reuse is unknown. [Context comparison](../artifacts/stage5/context_comparison.json), [budget ledger](../artifacts/stage5/request_budget.json) and seven individual trace files preserve the measurements. No fake token values or success labels were substituted.

## Impact and external evidence

[Impact protocol](impact_study_protocol.md) provides a 10–15-minute consented study, comparable selection tasks, answer keys, counterbalancing, separate plan review, a blank observation form and limitations. **No participant was accessed, interviewed, timed or rated. Human impact remains pending.** The author's fellowship is inspiration, not museum endorsement.

The official museum catalog's keyword, grade, subject and standards controls were directly reviewed. [Competitor analysis](competitor_analysis.md) fairly compares it with official MagicSchool and TripSlip descriptions, using “not established” instead of unsupported feature-absence claims. No vendor marketing time-saving figures were transferred to this prototype.

Public `gpt-6-luna` pricing and cache accounting were verified on official documentation. **Actual course gateway rates and out-of-pocket costs remain unestablished.** The most recent historical successful workflow projects to $0.0015918–$0.0018345 in illustrative Standard-price tokens, with a range because historical cache writes were not captured. The [cost CSV](../artifacts/stage5/cost_model.csv) covers one or three workflows per month at 1, 100 and 10,000 users. No failed new workflow is labeled a completed typical run. Hosting, support and gateway billing are excluded; see [Tokenomics](tokenomics_analysis.md).

## Automated regression and evidence validation

| Check actually executed | Result |
| --- | --- |
| Unchanged complete Python suite | **222 passed, 0 failed** |
| Unchanged complete frontend suite | **153 passed, 0 failed**, ten files |
| Evaluation-only safeguard/arithmetic tests | **6 passed, 0 failed** |
| Targeted draft safety rerun | **13 passed, 0 failed**; subset of frontend suite, not additive |
| TypeScript | Passed |
| Production build | Passed, 42 modules |
| Predefined internal scenarios | **24 passed, 0 failed** after retained harness-only correction |
| JSON/CSV arithmetic, evidence, security and preservation | **56 checks passed**, 0 failed; all 331 original tracked files unchanged |

Regression logs and JUnit are saved under `artifacts/stage5/`; no historical test artifact was overwritten. Independent checks recalculate scenario denominators, per-request token totals, cache classes, paired inputs/membership, projection arithmetic and repeated response IDs; validate JSON/CSV and local Markdown links; compare all **331** previously tracked file hashes; verify the approved HEAD/main/no-remotes/no-staging state; and scan new evidence for configured secret values and unredacted capability fields. Scope checking does not claim a content hash of the entire outside workspace.

No new browser walkthrough is claimed in this stage. Existing genuine Stage 4 live screenshots and Stage 4.4 offline browser/PDF evidence are precisely referenced in [agent evidence](agent_run_evidence.md). Full frontend tests run freshly; browser-automation timing is never presented as human impact.

## New files and reproducibility

All additions are under `evaluation/`, `artifacts/stage5/`, and these eight new documents: `evaluation_methodology.md`, `impact_study_protocol.md`, `competitor_analysis.md`, `tokenomics_analysis.md`, `safety_evaluation.md`, `agent_run_evidence.md`, `stage5a_b_validation.md`, `report_evidence_map.md`. The [file manifest](../artifacts/stage5/file_manifest.json) enumerates every new path and hash except itself. No existing tracked file is modified.

Evaluation tooling: `define_protocol.py` refuses to overwrite the predefined scenarios; `offline.py` reuses existing test factories and disables real requests; `audit_usage.py` recomputes historical usage; `context_experiment.py` is opt-in and bounded; `record_quality_review.py` records explicitly manual assistant ratings; `summarize.py` calculates comparisons/projections; `test_harness.py` checks cap/filter/math; `verify.py` independently checks evidence. Ordinary setup requires no new dependency.

```sh
.venv/bin/python -m evaluation.offline
.venv/bin/python -m evaluation.audit_usage
.venv/bin/python -m evaluation.summarize
.venv/bin/python -m pytest -q evaluation/test_harness.py -p no:cacheprovider --basetemp=.runtime/stage5-harness
.venv/bin/python -m evaluation.verify
```

These commands make no provider request. Rerunning offline tools updates only Stage 5 evidence, not historical receipts. The live harness deliberately refuses overwriting completed attempts and shares the persisted cap; reproduction of paid inference requires a separately reviewed new batch, not deleting its evidence or silently resetting the counter.

## Remaining gaps and stop point

- Human timing, usefulness ratings, consented feedback and measured impact remain uncollected.
- Course pricing/cache credit accounting remains unknown; illustrative prices are not actual charges.
- The optional complete two-agent paired experiment is incomplete because a real Designer false positive stopped it. Existing successful live workflows remain available.
- New prose false-negative and false-positive findings require review before relying on generated content without educator correction. No production repair was made in this evidence stage.
- Three paired tasks, one repetition each, assistant ratings and possible gateway reuse limit generalization. Lower-grade coverage, missing durations/standards and operational unknowns remain unchanged.

All work stayed within the project repository. No credential or workflow capability was added to evidence. No new feature, dependency, catalog edit, booking/email/payment action, Git commit, remote, push, deployment, report, slides, video or Stage 5C/5D work occurred. **Stop for user review.**
