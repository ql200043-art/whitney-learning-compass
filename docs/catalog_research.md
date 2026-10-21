# Stage 2 official catalog research ledger

**Review date:** October 21, 2026 (America/New_York).  
**Method:** Full official HTML detail pages opened and read directly in a live browser. Search snippets were not used as verification. The linked destination URLs below resolved to the named programs. No submissions, bookings or museum messages were sent.

## Fifteen additional candidates

| Program / official source | Verification | Published grades | Fee/student | Published duration | Specific unresolved detail |
| --- | --- | --- | --- | --- | --- |
| [The Whitney Relay](https://www.eliwhitney.org/whitney-relay) | Verified detail page | 4, 5, 6, 7+ | $10.00 | 90 min | Linked standards PDFs unverified; resource headings do not expand grades |
| [Rubber Band Car](https://www.eliwhitney.org/rubber-band-car) | Verified detail page | 3, 4, 5, 6, 7+ | $14.00 | Unknown | Duration unpublished |
| [Inventive Arm](https://www.eliwhitney.org/inventive-arm) | Verified detail page | 3, 4, 5, 6, 7+ | $14.00 | 90 min | Common unknowns below |
| [Marble Roller Coaster](https://www.eliwhitney.org/marble-roller-coaster) | Verified detail page | 4, 5, 6, 7+ | $14.00 | 90 min | Common unknowns below |
| [Sustainable Birdhouse](https://www.eliwhitney.org/sustainable-birdhouse) | Verified detail page | 3, 4, 5, 6, 7+ | $14.00 | 90 min | Common unknowns below |
| [Solar Sunflower](https://www.eliwhitney.org/solar-sunflower) | Verified detail page | 4, 5, 6, 7+ | $14.00 | 90 min | Common unknowns below |
| [Resourceful Schools](https://www.eliwhitney.org/resourceful-schools) | Verified detail page | 2, 3, 4 | $18.00 | 120 min | 2-hour field / two-session recommendation needs clarification |
| [Ecosystems: Magnetic Pendulum](https://www.eliwhitney.org/ecosystems-magnetic-pendulum) | Verified detail page | 2, 3, 4 | $14.00 | 90 min | Common unknowns below |
| [Electromagnet](https://www.eliwhitney.org/electromagnet) | Verified detail page | 3, 4, 5, 6 | $14.00 | 90 min | Linked standards PDF unverified |
| [Camera Obscura](https://www.eliwhitney.org/camera-obscura) | Verified detail page | 4, 5, 6, 7+ | $14.00 | 90 min | Common unknowns below |
| [Orrery](https://www.eliwhitney.org/orrery) | Verified detail page | 5, 6, 7+ | $15.00 | 90 min | Common unknowns below |
| [Rocks of Connecticut](https://www.eliwhitney.org/rocks-connecticut) | Verified detail page | 3, 4, 5, 6, 7+ | $14.00 | 90 min | Common unknowns below |
| [The Mill](https://www.eliwhitney.org/mill) | Verified detail page | 3, 4, 5, 6, 7+ | $15.00 | 120 min | Common unknowns below |
| [Global Architecture & Transportation](https://www.eliwhitney.org/cultures) | Verified detail page | 2, 3, 4, 5, 6 | $18.00 | 120 min | Common unknowns below |
| [Art and Light](https://www.eliwhitney.org/art-and-light) | Verified detail page | 1, 2, 3, 4, 5, 6 | $14.00 | 90 min | Common unknowns below |

**Common unknowns for all 20 records:** program-specific standards not verified, group-size minimum/maximum, program-specific accommodations, booking availability, explicitly published ISO currency code, and program update date. Additional charges, special delivery and booking conditions are also not established by this catalog; the matcher presents them as operational confirmation items without inventing numeric costs.

Exact published subject labels and concise factual descriptions are in [programs.json](../data/programs.json), with field-level evidence and per-null reasons/actions. The unusual Orrery subject label “Interaction of Sun” is preserved as published. Editorial themes are stored separately in [program_themes.json](../data/program_themes.json).

## Five pilot rechecks

The [Simple Machines](https://www.eliwhitney.org/simple-machines), [Catapult](https://www.eliwhitney.org/catapult), [Bridges](https://www.eliwhitney.org/bridges), [Wind Power](https://www.eliwhitney.org/sustainable-energy-wind-power), and [Tangrams](https://www.eliwhitney.org/tangrams) pages were re-read during Stage 2. Their displayed grades, subjects, prices, durations where present, and descriptions did not justify changing any pilot record.

- Bridges still has no published workshop time.
- Tangrams' current live Grade Level links include K, 1–6 and 7+. The earlier extraction discrepancy remains documented in its original notes.
- The other four pilot pages still publish 1.50 hours; the four $14 fees and Wind Power's $15 fee remain unchanged.
- All five complete JSON program objects are preserved, including IDs, original evidence, verification notes and unknown-field inventories. Rechecks are recorded here rather than overwriting the original verification history.

## Limitations and follow-up evidence

- **Rubber Band Car:** no School Program Time field was displayed. Both duration fields are null.
- **Resourceful Schools:** School Program Time says 2.00 hours and the description recommends two sessions. Store 120 published minutes and $18/student as displayed, while warning that session scheduling, fee coverage and whether that time is combined or per session require museum confirmation. No doubled duration or fee was inferred.
- **The Whitney Relay:** Grade Level metadata lists 4, 5, 6, 7+, while linked resource headings mention Grades 3–5 and 6–8. Resource headings are not treated as current eligibility. The following Program Information links were inaccessible to web retrieval; the first browser fallback timed out, after which an extension UI blocked further browser automation:
  - [Grades 3–5 Program Information](https://www.eliwhitney.org/sites/eliwhitney/files/3-5%2520%2520WR%2520Prog%2520Info%2520rev%25209.1.08.pdf)
  - [Grades 6–8 Program Information](https://www.eliwhitney.org/sites/eliwhitney/files/6-8%252520%252520WR%252520Prog%252520Info%252520rev%2525209.1.08.pdf)
- **Electromagnet:** its official HTML page links a [Program Overview PDF on the museum-linked legacy host](https://eliwhitney.oneeach.org/sites/eliwhitney/files/Electromag%2520Prog%2520Info.pdf). Web retrieval could not access it. Teacher/student worksheets also remain unreviewed. No standard code was inferred from these links.
- No program-specific standards are asserted from unreviewed PDF contents. These linked-resource gaps do not invalidate the facts reviewed on the full HTML detail pages.
- Availability, capacity and access suitability remain operational questions. Current page access is not evidence of available workshop dates or a binding future quote.

All 15 original candidates were retained; **no substitutions** were made. No copied full website descriptions or persistent runtime scraper were created.
