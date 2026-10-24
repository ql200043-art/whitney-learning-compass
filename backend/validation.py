"""Validate IDs, evidence and generated prose; assemble facts from the catalog."""
import re
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

def _check_catapult_material(text, program):
    """A source-grounded check for the observed projectile substitution, not entailment.

    Scope is this recommendation's program, never all recommendations combined.
    Other factual claims still require educator review.
    """
    if program["id"] != "ewm-catapult":
        return
    source = evidence_for(program, "/description")
    if not (source and source["status"] in {"verified", "paraphrased"}
            and "supplied ping-pong ball" in (program["description"] or "").lower()):
        raise OutputRejected("Catapult material grounding unavailable")
    text = text.lower()
    for mention in re.finditer(r"\bmarbles?\b", text):
        # Naming the other real program is not claiming it is Catapult's projectile.
        if re.match(r"marble roller coaster\b", text[mention.start():]):
            continue
        prefix = text[:mention.start()]
        if re.search(r"\b(?:not|(?:do not|don't|never) (?:use|launch|substitute))\s+(?:a |any )?$", prefix):
            continue
        raise OutputRejected("Catapult material contradicts supplied ping-pong ball")


def _text_leaves(value):
    """Keep fields/items separate so a warning cannot authorize another field."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from _text_leaves(item)
    elif isinstance(value, list):
        for item in value:
            yield from _text_leaves(item)


def _check_empirical_evidence(value):
    # Each fabrication term is evaluated independently, including two in one clause.
    # Only these explicit local prohibitions are exempt; arbitrary negation is not.
    fabrication = re.compile(r"\b(?:made[- ]up|make up|fabricat\w*|invent\w*|simulat\w*|fictional|hypothetical|fak(?:e|ed|ing)|falsif\w*)\b")
    empirical = re.compile(r"\b(?:observations?|measurements?|results?|findings|learning outcomes?|test scores?|data|evidence)\b")
    prohibition = re.compile(r"\s*(?:please\s+)?(?:do not|don't|never)\s+"
        r"(?:(?:supply|use|record|create|add)\s+|fill (?:the |any )?gaps with\s+|infer or\s+)?")
    for text in _text_leaves(value):
        for clause in re.split(r"[.!?;:\n]", text.lower().replace("’", "'")):
            for term in fabrication.finditer(clause):
                if not empirical.search(clause[term.end():]):
                    continue
                if not prohibition.fullmatch(clause[:term.start()]):
                    raise OutputRejected("Invented empirical evidence suggestion")


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
        _check_catapult_material(c.educational_reasoning, programs[c.program_id])
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
    _check_empirical_evidence(draft.model_dump(exclude={"program_id", "evidence"}))
    return draft

