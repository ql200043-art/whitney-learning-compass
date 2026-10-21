# Stage 1 validation receipt

**Completed:** October 21, 2026 (America/New_York)  
**Scope:** Documentation and a manually researched five-program pilot; no application implementation.

## Created files

- [Project scope](project_scope.md)
- [Data dictionary](data_dictionary.md)
- [Pilot dataset](../data/programs.json)
- [Catalog expansion plan](catalog_expansion_plan.md)
- [This validation receipt](stage1_validation.md)

All files are inside `AI Foundations/Final Project/whitney-learning-compass`. The pre-existing `Final Project/.gitkeep` was preserved.

## Official-source review actually completed

All five linked detail pages were opened and read directly in a live browser on the review date. The official catalog was also read to confirm the 15 expansion candidates' names and exact destination links. Those 15 detail pages have not been researched as Stage 2 records.

| Official program / source | Published grade tokens | Fee per student | Workshop time |
| --- | --- | --- | --- |
| [Simple Machines](https://www.eliwhitney.org/simple-machines) | 2, 3, 4, 5 | $14.00 | 1.50 hours / 90 minutes |
| [Catapult](https://www.eliwhitney.org/catapult) | 3, 4, 5, 6, 7+ | $14.00 | 1.50 hours / 90 minutes |
| [Bridges](https://www.eliwhitney.org/bridges) | 4, 5, 6, 7+ | $14.00 | Unknown; not published on reviewed page |
| [Sustainable Energy: Wind Power](https://www.eliwhitney.org/sustainable-energy-wind-power) | 4, 5, 6, 7+ | $15.00 | 1.50 hours / 90 minutes |
| [Tangrams](https://www.eliwhitney.org/tangrams) | K, 1, 2, 3, 4, 5, 6, 7+ | $14.00 | 1.50 hours / 90 minutes |

Also checked: exact program names/URLs, published subjects, and descriptions supporting the concise paraphrases. A displayed price is a program fee, not a total trip cost or a binding future quote.

### Unknowns and source-quality concerns

- Bridges' session length remains null.
- All five reviewed pages omit program-specific published standards codes/statements, group-size limits, accommodation details, an explicit ISO currency code, a program-specific update date, and confirmed booking availability. These fields remain null with reasons and next actions. Missing standards evidence does not mean no alignment.
- Dollar symbols are preserved. An ISO currency code is not silently assumed from the museum's location; a currency-sensitive hard budget check requires clarification.
- The web-fetch tool initially failed on Wind Power; live browser access succeeded, so its displayed fields were verified.
- A web-extracted Tangrams view contained a second grade line ending at 6. The current live page's grade links include 7+; direct live evidence controls this record. The discrepancy is retained in its verification notes.
- The 7+ token supports Grade 7 in the initial audience. No upper grade limit is fabricated.
- Availability, suitability for a particular access requirement, and future delivery terms were not established by reading a program page. No booking form was submitted and no museum contact was made.

## Local checks actually executed

A one-time Python standard-library check read the saved JSON and Markdown and completed with exit code 0. It checked:

- JSON parsing; exactly **5** pilot records, unique IDs and unique official URLs.
- The exact five requested names, the displayed price amounts/basis, the four known durations, and the null Bridges duration.
- Reproducible Grades 2–7 normalization and unique subject labels within each program.
- **70** field-evidence entries: pointers resolve, statuses are allowed, and source IDs resolve within their records.
- **37** null fields: every null has a unique matching unknown-field entry, reason and next step; every declared unknown points to null.
- Exactly **15** distinct official expansion URLs, none overlapping the five pilot URLs; editorial group counts are 4 engineering, 4 sustainability/environment, 4 science and 3 interdisciplinary.
- No Python, TypeScript, TSX or HTML application artifacts in the project; no `report.html`, `slides.html`, `.env`, agents, API or frontend was created.
- The joke file was read back and its resolved path was confirmed inside the project directory.

These are dataset/document integrity checks, not executed model evaluations, safety tests, user studies or evidence of learning impact. Future evaluation targets are documented in the scope only.

### Workspace boundary check

Before and after authoring, a deterministic snapshot of all existing workspace files outside the new project directory recorded relative paths, file sizes, modification timestamps and modes. Both snapshots matched:

- Existing files outside project: **195,878**
- Total recorded bytes: **4,707,105,472**
- Metadata SHA-256: `e745309829d9bc4f36bd42f5b805e98dd705f81b2bd62071d1ad55ba83fd3ce2`

This is a file-metadata comparison, not a content hash of the entire workspace. All task file writes were directed to the new project directory. Homework 1–5, lecture folders and unrelated existing workspace files were not modified.

## Execution boundary

No Portkey, OpenAI or other model-provider/inference API calls were made for the project. No credentials or `.env` files were read. Public-web research tools, a browser and local file operations were used. No model-generated demonstration runs, fake feedback, usage numbers, safety results or impact metrics were created.

**Stage 1 is ready for review. Stage 2 remains unstarted.**

## Stage 1.1 documentation amendment

**Amended:** October 21, 2026 (America/New_York), separately recorded from the original Stage 1 completion date.

The temporary `proof-joke.txt` was created and checked during Stage 1, then subsequently removed as unrelated cleanup at the user's request. It was already absent when Stage 1.1 began; it has not been recreated, and its broken link has been removed from the file list. The original check of that file above remains a historical fact.

All original Stage 1 validation statistics, source findings and workspace snapshot evidence above are preserved; they describe the original checks, not a rerun in Stage 1.1. The [refined scope](project_scope.md) now separates eligibility from operational confirmation and permits an explicitly labeled application USD assumption. This changes future application policy, not the original finding that the museum did not explicitly publish an ISO currency code. The dataset and data dictionary remain unchanged.

Stage 1.1 adds proposed user evaluation, named competitive positioning, a future Tokenomics comparison and a Grade × Theme coverage checkpoint. These are documentation plans, not executed experiments, new program research or application development. Stage 2 remains unstarted.
