"""Validate IDs, evidence and generated prose; assemble facts from the catalog."""
from .models import Candidate, ProgramFacts
from .safety import OutputRejected, guard_suggestions
from matching.catalog import evidence_for, resolve_pointer, CatalogError

def facts(program):
    return ProgramFacts.model_validate({k:program[k] for k in ProgramFacts.model_fields})

def validate_refs(refs, program):
    for ref in refs:
        if ref.program_id != program["id"]:
            raise OutputRejected("Cross-program evidence")
        evidence=evidence_for(program,ref.field)
        try:
            resolve_pointer(program,ref.field)
        except CatalogError:
            raise OutputRejected("Invalid evidence pointer") from None
        if not evidence or evidence["source_id"]!=ref.source_id:
            raise OutputRejected("Invalid evidence reference")
        # A source may document an unknown (e.g. capacity). Citing that absence is
        # valid evidence of uncertainty; it never changes the deterministic status.

def validate_advisor(draft, programs, matches, tools):
    if "search_matching_programs" not in tools:
        raise OutputRejected("Required matching tool not invoked")
    guard_suggestions({"goal":draft.interpreted_goal,"reasoning":[c.educational_reasoning for c in draft.choices]})
    if len({c.program_id for c in draft.choices})!=len(draft.choices):
        raise OutputRejected("Duplicate recommendation")
    results=[]
    for c in draft.choices:
        if c.program_id not in programs or c.program_id not in matches:
            raise OutputRejected("Unknown program")
        m=matches[c.program_id]
        required={"pass":"eligible","unknown":"provisional"}.get(m["eligibility_status"])
        if required is None or c.category!=required:
            raise OutputRejected("Eligibility override")
        validate_refs(c.evidence,programs[c.program_id])
        results.append(Candidate(program_id=c.program_id,category=c.category,
            ai_educational_reasoning=c.educational_reasoning,evidence=c.evidence,
            museum_facts=facts(programs[c.program_id]),eligibility=m))
    return results

def validate_journey(draft, program, tools):
    if draft.program_id!=program["id"]:
        raise OutputRejected("Wrong selected program")
    if "get_selected_program" not in tools:
        raise OutputRejected("Required selected-program tool not invoked")
    validate_refs(draft.evidence,program)
    guard_suggestions(draft.model_dump(exclude={"program_id","evidence"}))
    return draft

