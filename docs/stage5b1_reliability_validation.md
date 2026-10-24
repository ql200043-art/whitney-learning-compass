# Stage 5B.1 — Targeted reliability validation

Executed October 23, 2026 (America/New_York). Two observed validator defects were repaired. **No new model inference, product feature, catalog change, agent change, or frontend change.**

## Evidence baseline and checkpoint

Evidence checkpoint: `2b54f2c650e4097cb30fd7782a04d1de70df1fcf`, on `main`, with parent Stage 4.4 checkpoint `a9ea536ad369fcd3f5abcc63dc0fe7edc3611232`. Message: `docs(eval): preserve Stage 5 evidence and P01 pilot study`. It adds exactly **47** accepted evaluation/artifact/documentation files and changes none of the **331** previously tracked files. The working tree was clean immediately after this commit; no remote was configured.

Pre-commit review re-executed the existing evidence verifier in memory with only the P01 document allowlist and output destination adjusted: **57 checks passed**, saved in the [checkpoint receipt](../artifacts/stage5b1/evidence-checkpoint-checks.json). Original scenario outcomes, token sums, cache classes, paired contexts, cost arithmetic, JSON/CSV, Markdown links, credential/capability redaction, and boundaries were checked. The original verifier and historical receipts were not rewritten.

The frozen Stage 5 manifest has **44/45 matching hashes**. Its sole difference is the approved later P01 amendment to `docs/report_evidence_map.md`; the new `docs/impact_study_results.md` was not part of that earlier snapshot. This chronology is preserved. The evidence commit records both current P01 files without rewriting the manifest. P01 remains one graduate-student proxy study, separate from the 24 technical scenarios, with its original timing exclusions, ratings, critical feedback, quotation-permission uncertainty and limitations.

Default Git whitespace review reported CRLF in two CSVs, terminal-log blank lines, and six intentional Markdown hard breaks in P01. File-scoped checks accepting those formats passed. The historical bytes were preserved; no repository-wide whitespace configuration was changed.

## Issue A: Catapult factual false negative

The [original Full Advisor output](../artifacts/stage5/A01-full-advisor.json) describes Catapult design choices affecting “the marble's movement.” The catalog's source-backed Catapult description specifies the **supplied ping-pong ball**, and its verification notes retain the museum's conditional safety statement. Marble Roller Coaster genuinely uses a marble.

Previously, `validate_advisor` checked IDs, deterministic eligibility, references, and general prohibited claims. It assembled factual fields from the catalog but did not compare this material claim in generated reasoning with the relevant program. A valid citation did not establish that the prose followed the cited content. This affects production too: the Full experiment changes search context, while both experimental conditions and production use this same validator.

The repair adds a small program-specific check in [backend/validation.py](../backend/validation.py), after identity/eligibility/reference validation and before a candidate is returned. For Catapult, it requires the source-backed ping-pong-ball description and rejects unnegated marble references in that choice's reasoning. Explicit local warnings such as “not a marble” and “never use marbles” remain valid; naming the separate Marble Roller Coaster program remains valid. Each choice is inspected separately, so legitimate marbles in another recommendation are unaffected. No global marble prohibition or new museum fact was introduced.

The original flawed response now raises a controlled `invalid_model_output` through the real service integration test, without creating an accepted workflow. Correct descriptions, mixed choices, the five other preserved Stage 5 Advisor outputs, source references, the independently expected $336 subtotal, and operational unknowns remain intact.

## Issue B: Designer safety false positive

The [original Full Designer output](../artifacts/stage5/A01-full-designer.json), for the explicitly selected Marble Roller Coaster, was rejected by the empirical-evidence guard. Its two benign prohibitions include “do not fill gaps with invented measurements or results” and “do not infer or fabricate results.”

Previously, a regex scanned a stringified whole-plan dictionary and examined only a short prefix, accepting a narrow list of negation forms. Neither recorded construction matched. This is the production Designer guard, not an experiment-only restriction.

The repair scans individual instructional strings and punctuation-bounded clauses. Each fabrication term is checked independently. Only a finite set of immediate, clause-local prohibitions is exempt, including the two observed constructions. A negation elsewhere in the sentence, another field, or another list item cannot grant an exemption. Two fabrication terms in one clause are checked separately. Empirical targets include observations, measurements, results, learning outcomes, scores, data and evidence; explicitly labeled predictions remain permitted when they are not fabricated empirical evidence.

Other safety/private-data/factual-claim guards remain in place. Affirmative fabrication, plausible invented student measurements, made-up learning outcomes, mixed safe/unsafe instructions, “never fail to fabricate,” and “do not only fabricate” are rejected in the added tests. No guard was removed, no retry was added, and no model output was edited to pass.

## Offline replay and regression results

**Offline revalidation of previously generated real-model output** used the exact stored output, recorded genuine tool context, current unchanged catalog/matching functions, and preserved selection evidence. It is not new live inference.

| Preserved output | Before repair, rerun locally | After repair, rerun locally |
| --- | --- | --- |
| A01 Full Advisor, including wrong Catapult projectile | Accepted incorrectly | Rejected: Catapult material contradicts supplied ping-pong ball |
| A01 Full Designer, including benign prohibitions | Rejected: invented empirical evidence suggestion | Accepted unchanged |

See [before receipt](../artifacts/stage5b1/before-revalidation.json) and [after receipt](../artifacts/stage5b1/replay/after-revalidation.json); both retain source hashes. A separate FunctionModel test replays the valid recorded Marble recommendation and unchanged Designer output through the actual service and registered tools, with an explicit **simulated test selection** and fresh in-memory authorization. It checks unchanged hard constraints, $336, three phases, museum questions, no booking confirmation, and zero provider requests. It does not reconstruct expired live authorization or claim a new human/model session.

| Check actually executed | Result |
| --- | --- |
| Complete Python suite | **284 passed, 0 failed**: original 222 plus 62 new regressions |
| Focused Stage 5B.1 tests, separate rerun | **62 passed, 0 failed**; included in 284, not additive |
| Complete frontend suite | **153 passed, 0 failed**, ten files |
| Existing evaluation-harness suite | **6 passed, 0 failed** |
| Original 24 technical scenarios, isolated rerun | **24 passed, 0 failed**, zero provider requests |
| E24 draft recovery frontend subset | **13 passed, 0 failed**, included in frontend suite |
| TypeScript check | Passed |
| Production build | Passed, 42 modules |

Logs/JUnit are under [artifacts/stage5b1](../artifacts/stage5b1/). [Scenario replay](../artifacts/stage5b1/replay/scenario-revalidation.json) retains individual expected/actual outcomes, constraint assertions, tool names and no-live-request indicators. The existing harness's E24 output was redirected too. No failed or skipped final tests remain. Initial focused development checks also passed; no prior assertion was weakened or changed.

Reproduce from the repository root, after ordinary project setup:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider --basetemp=.runtime/b1-python
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q tests/test_stage5b1_validation.py -p no:cacheprovider --basetemp=.runtime/b1-focused
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q evaluation/test_harness.py -p no:cacheprovider --basetemp=.runtime/b1-harness
npm test --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m evaluation.revalidate_stage5b1 --output-dir .runtime/b1-replay
```

The replay command requires a **new** directory; use a different unused `.runtime/` name for another run. It refuses overwriting an existing directory, disables real PydanticAI requests, reads the frozen scenario file and redirects new results. Do not run the original Stage 5 writer commands against historical artifacts.

## Preservation, security and changed files

The [final integrity receipt](../artifacts/stage5b1/integrity-checks.json) records **26 passed, 0 failed** checks covering evidence hashes, scope, original-test preservation, source/replay integrity and credentials. P01, all 47 evidence-checkpoint files, the failed harness attempt, all original live traces/response IDs/token values, and Stage 3–4 artifacts remain byte-identical. Of the original 331 Stage 4.4 files, only the authorized `backend/validation.py` changed. Source facts, timestamps, catalog, matching, agents, gateway/model configuration, limits, authorization, frontend, PDF and draft behavior are untouched.

Changed/added paths in the repair checkpoint:

- `backend/validation.py`: the two scoped validator repairs; sole production change.
- `tests/test_stage5b1_validation.py`: 62 offline regressions using preserved actual output as fixtures; no duplicated provider traces.
- `evaluation/revalidate_stage5b1.py`: isolated, offline replay/technical-scenario runner.
- `docs/stage5b1_reliability_validation.md`: this report.
- `artifacts/stage5b1/`: checkpoint review receipt, before/after replay, test/build logs and JUnit, isolated scenario results and final integrity receipt.

Configured secret values were scanned in memory without printing them. JSON capability fields, bearer/private-key patterns, filenames and staged contents were checked. The original authorization notes are plain provenance text, not capabilities. No `.env`, runtime cache, credential, workflow token, unredacted private trace, or unrelated workspace content is part of either checkpoint. All work writes stayed inside this project; this does not claim a content audit of the entire outside workspace.

## Residual risk and stop point

The material check is deliberately scoped to Catapult's recommendation reasoning and the observed marble contradiction. It is not a universal materials verifier or full natural-language entailment test; other materials, paraphrases, other prose fields, or complex cross-program comparisons can still require review. Ambiguous marble comparisons may be conservatively rejected. If the catalog's grounding changes, the explicit source prerequisite requires review instead of silently applying a stale assumption.

The empirical guard is also heuristic. Unlisted wording, complex syntax, cross-sentence implications, or multilingual text may cause false negatives or false positives; some legitimate hypothetical discussions remain conservatively rejected. Structured catalog/eligibility checks provide firmer guarantees than prose checks. **The system is not hallucination-proof; educator review remains necessary.**

These changes support a supervised final demonstration using the unchanged workflow and preserved successful historical live evidence. No new live end-to-end success is asserted, and provider availability has not been rechecked. The original rejected Full Designer attempt remains rejected in history; Shortlist Designer remains unexecuted, and there is still no successful new paired Designer comparison. P01 timing and feedback and all historical performance figures are unchanged.

No additional gateway requests, tokens, paid retries, product features, dependencies, guided-input redesign, report/slides, Stage 5C/5D work, remote configuration, push, deployment or submission occurred. A separate repair commit follows this validation; its identity is available in Git history and the final handoff, without amending the evidence checkpoint.
