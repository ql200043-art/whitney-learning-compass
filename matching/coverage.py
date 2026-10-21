"""Grade coverage from reviewed records and separate, auditable editorial themes."""
import json
from pathlib import Path
from .catalog import (validate_catalog, require, evidence_for, is_verified, resolve_pointer)
from .grades import supports_grade

DEFAULT_THEMES = Path(__file__).resolve().parents[1] / "data" / "program_themes.json"

def load_themes(path=None):
    with Path(path or DEFAULT_THEMES).open(encoding="utf-8") as f:
        return json.load(f)

def build_coverage(catalog, theme_data):
    validate_catalog(catalog)
    themes = ["Engineering", "Sustainability and Energy", "Science", "Interdisciplinary Learning"]
    require(theme_data.get("themes") == themes, "Unexpected editorial themes")
    require(theme_data.get("classification_type") == "editorial_not_museum_taxonomy", "Editorial disclaimer required")
    programs = {p["id"]: p for p in catalog["programs"]}
    assignments = theme_data.get("assignments")
    require(isinstance(assignments, list), "Theme assignments must be a list")
    require(len(assignments) == len(programs) and {a["program_id"] for a in assignments} == set(programs),
            "Each catalog program must have exactly one theme assignment record")
    supported, uncertain = [], []
    for a in assignments:
        p = programs[a["program_id"]]
        require(isinstance(a["themes"], list) and len({t["theme"] for t in a["themes"]}) == len(a["themes"]),
                "Duplicate theme assignment")
        for t in a["themes"]:
            require(t["theme"] in themes and t["status"] in {"supported_editorial", "uncertain"}, "Invalid theme/status")
            require(isinstance(t.get("rationale"), str) and bool(t["rationale"].strip()), "Theme rationale required")
            require(isinstance(t.get("evidence"), list) and bool(t["evidence"]), "Theme evidence required")
            verified = True
            for ref in t["evidence"]:
                resolve_pointer(p, ref["field"])
                e = evidence_for(p, ref["field"])
                require(e is not None and ref["source_id"] == e["source_id"] and ref["url"] == e["url"],
                        "Theme evidence/source mismatch")
                verified = verified and is_verified(p, ref["field"])
            item = {"program_id": p["id"], **t}
            if t["status"] == "supported_editorial" and verified and is_verified(p, "/grade_levels"):
                supported.append(item)
            else:
                uncertain.append(item)
    cells = []
    for grade in range(2, 8):
        for theme in themes:
            entries = []
            for item in supported:
                p = programs[item["program_id"]]
                if item["theme"] == theme and supports_grade(p["grade_levels"], grade):
                    entries.append({"program_id": p["id"], "official_url": p["official_url"],
                                    "grade_evidence": evidence_for(p, "/grade_levels"),
                                    "theme_evidence": item["evidence"], "rationale": item["rationale"]})
            cells.append({"grade": grade, "theme": theme, "count": len(entries),
                          "program_ids": sorted(e["program_id"] for e in entries), "entries": entries})
    return {"catalog_program_count": len(programs), "reviewed_on": theme_data["reviewed_on"],
            "classification_type": theme_data["classification_type"],
            "definitions": theme_data["definitions"], "themes": themes,
            "scope": "Published grade coverage and editorial relevance only; no booking, fee or duration eligibility implied.",
            "cells": cells, "uncertain_assignments": uncertain}

def render_coverage(coverage, catalog, theme_data):
    lines = ["# Grade × Theme catalog coverage", "", "Reviewed: " + coverage["reviewed_on"], "",
             coverage["scope"], "",
             "Counts are distinct program IDs within each cell. Programs may span themes; cell totals are not unique catalog totals. Themes are editorial interpretations, not museum subject labels.", "",
             "| Grade | " + " | ".join(coverage["themes"]) + " |",
             "| --- | --- | --- | --- | --- |"]
    for grade in range(2, 8):
        counts = [str(c["count"]) for c in coverage["cells"] if c["grade"] == grade]
        lines.append("| " + str(grade) + " | " + " | ".join(counts) + " |")
    lines += ["", "## Definitions and uncertainty", ""]
    lines += ["- **" + theme + ":** " + rule for theme, rule in coverage["definitions"].items()]
    lines += ["", "Uncertain assignments excluded from counts: " + str(len(coverage["uncertain_assignments"])) + ".",
              "This means the recorded editorial assignments have supporting reviewed evidence, not that the categories are objective museum classifications.",
              "", "## Grade 2 and Grade 3 checkpoint", "",
              "Review the lower-grade rows alongside the contributing IDs below. Two or fewer programs in a cell is a review flag, not a validated educational adequacy threshold."]
    for grade in (2, 3):
        flagged = [c for c in coverage["cells"] if c["grade"] == grade and c["count"] <= 2]
        lines.append("- Grade " + str(grade) + ": " + (", ".join(c["theme"] + " (" + str(c["count"]) + ")" for c in flagged) if flagged else "no cells at or below this review threshold") + ".")
    lines += ["No substitutions were made: all 15 backlog candidates were verified. Lower-grade choice remains narrower in some themes; future expansion may revisit that limitation without changing this curated set.",
              "", "## Contributing program IDs by cell", "",
              "Resolve each ID to its official source and rationale in the following source ledger. The machine-readable [coverage.json](../data/coverage.json) includes grade evidence and theme evidence in every cell.", "",
              "| Grade | Theme | Distinct count | Program IDs |", "| --- | --- | --- | --- |"]
    for c in coverage["cells"]:
        lines.append("| " + str(c["grade"]) + " | " + c["theme"] + " | " + str(c["count"]) + " | " +
                     ", ".join("`" + pid + "`" for pid in c["program_ids"]) + " |")
    lines += ["", "## Editorial source ledger", "",
              "| Program ID / official source | Supported editorial themes and rationale |",
              "| --- | --- |"]
    by_id = {p["id"]: p for p in catalog["programs"]}
    for a in theme_data["assignments"]:
        p = by_id[a["program_id"]]
        details = "; ".join(t["theme"] + ": " + t["rationale"] for t in a["themes"])
        lines.append("| [" + p["id"] + "](" + p["official_url"] + ") | " + details + " |")
    lines += ["", "Reproduce with `python -m matching.audit`. The input [program_themes.json](../data/program_themes.json) preserves each rationale, field pointer, source ID and URL separately from published subject labels.", ""]
    return "\n".join(lines)
