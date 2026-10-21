"""Validate the original Stage 1 JSON structure, without altering source records."""
import json
import math
import re
from datetime import date
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlsplit
from .grades import in_scope_grades

DEFAULT_CATALOG = Path(__file__).resolve().parents[1] / "data" / "programs.json"
REQUIRED = {"id", "official_name", "official_url", "grade_levels", "in_scope_grade_levels",
            "subjects", "description", "price", "duration", "published_standards", "group_size",
            "accessibility_notes", "booking_availability", "verification", "sources",
            "field_evidence", "unknown_fields"}
FACT_FIELDS = REQUIRED - {"id", "verification", "sources", "field_evidence", "unknown_fields"}
EVIDENCE_STATUSES = {"verified", "normalized", "paraphrased", "unknown",
                     "pending_verification", "conflicting"}
TRUSTED_STATUSES = {"verified", "normalized", "paraphrased"}

class CatalogError(ValueError):
    """Invalid catalog structure or internally inconsistent evidence."""

def require(condition, message):
    if not condition:
        raise CatalogError(message)

def nonempty(value):
    return isinstance(value, str) and bool(value.strip())

def numeric(value, minimum=0):
    return type(value) in (int, float) and math.isfinite(value) and value >= minimum

def iso_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False

def canonical_url(url):
    require(nonempty(url), "URL must be a nonempty string")
    u = urlsplit(url)
    require(u.scheme == "https" and u.netloc in {"www.eliwhitney.org", "eliwhitney.org"}
            and u.path not in {"", "/"} and not u.query and not u.fragment,
            "Expected an official HTTPS canonical detail URL: " + url)
    return u.path.rstrip("/")

def resolve_pointer(obj, pointer):
    require(isinstance(pointer, str) and pointer.startswith("/"), "Invalid JSON pointer")
    try:
        for part in pointer[1:].split("/"):
            part = part.replace("~1", "/").replace("~0", "~")
            obj = obj[int(part)] if isinstance(obj, list) else obj[part]
        return obj
    except (KeyError, IndexError, ValueError, TypeError) as exc:
        raise CatalogError("Unresolved evidence/unknown pointer: " + pointer) from exc

def null_pointers(value, prefix=""):
    if value is None:
        return {prefix}
    if isinstance(value, dict):
        return set().union(*(null_pointers(v, prefix + "/" + k.replace("~", "~0").replace("/", "~1"))
                             for k, v in value.items())) if value else set()
    if isinstance(value, list):
        return set().union(*(null_pointers(v, prefix + "/" + str(i))
                             for i, v in enumerate(value))) if value else set()
    return set()

def evidence_for(program, pointer):
    while pointer:
        if pointer in program["field_evidence"]:
            e = program["field_evidence"][pointer]
            source = next(s for s in program["sources"] if s["source_id"] == e["source_id"])
            return {"field": pointer, **e, "url": source["url"], "accessed_on": source["accessed_on"]}
        pointer = pointer.rsplit("/", 1)[0]
    return None

def is_verified(program, pointer):
    e = evidence_for(program, pointer)
    return (resolve_pointer(program, pointer) is not None and e is not None
            and e["status"] in TRUSTED_STATUSES)

def _keys(obj, fields, label):
    require(isinstance(obj, dict) and set(fields) <= set(obj), label + ": missing required fields")

def validate_program(p):
    _keys(p, REQUIRED, "program")
    require(nonempty(p["id"]) and re.fullmatch(r"ewm-[a-z0-9-]+", p["id"]), "Invalid program id")
    canonical_url(p["official_url"])
    for field in ("official_name", "description", "accessibility_notes", "booking_availability"):
        require(p[field] is None or nonempty(p[field]), field + ": expected text or null")
    require(nonempty(p["official_name"]), "Program identity must be verified before catalog admission")
    for field in ("grade_levels", "subjects"):
        values = p[field]
        require(values is None or (isinstance(values, list) and len(values) > 0
                and all(nonempty(x) for x in values) and len(set(values)) == len(values)),
                field + ": expected unique nonempty labels or null")
    if p["grade_levels"] is not None:
        allowed = {"PreK", "K", "7+"} | {str(i) for i in range(1, 13)}
        require(set(p["grade_levels"]) <= allowed, "Invalid published grade label")
    scoped = p["in_scope_grade_levels"]
    require(scoped is None or (isinstance(scoped, list) and all(type(g) is int and 2 <= g <= 7 for g in scoped)
            and scoped == sorted(set(scoped))), "Invalid normalized grade list")
    price = p["price"]
    _keys(price, {"listed_text", "amount", "currency_symbol", "currency_code", "basis"}, "price")
    require(price["amount"] is None or numeric(price["amount"]), "Price must be finite and nonnegative or null")
    for key in ("listed_text", "currency_symbol"):
        require(price[key] is None or nonempty(price[key]), "Invalid price " + key)
    require(price["currency_code"] is None or (isinstance(price["currency_code"], str)
            and re.fullmatch(r"[A-Z]{3}", price["currency_code"])), "Invalid currency code")
    require(price["basis"] in {None, "per_student"}, "Unsupported fee basis")
    if price["amount"] is not None:
        require(Decimal(str(price["amount"])).as_tuple().exponent >= -2, "Price exceeds cent precision")
        require(price["listed_text"] is not None, "Known price requires its published label")
        m = re.fullmatch(r"\$(\d+(?:\.\d{2})?) per student", price["listed_text"])
        require(m is not None and Decimal(m[1]) == Decimal(str(price["amount"]))
                and price["currency_symbol"] == "$" and price["basis"] == "per_student",
                "Price amount, symbol, basis and source label disagree")
    duration = p["duration"]
    _keys(duration, {"listed_text", "minutes"}, "duration")
    require(duration["minutes"] is None or (type(duration["minutes"]) is int
            and duration["minutes"] > 0), "Duration must be positive integer minutes or null")
    require(duration["listed_text"] is None or nonempty(duration["listed_text"]), "Invalid duration label")
    if duration["minutes"] is not None:
        require(duration["listed_text"] is not None, "Known duration requires published label")
        m = re.fullmatch(r"(\d+(?:\.\d+)?) hours", duration["listed_text"])
        require(m is not None and Decimal(m[1]) * 60 == duration["minutes"],
                "Published hours and normalized minutes disagree")
    _keys(p["group_size"], {"min_students", "max_students"}, "group_size")
    for v in p["group_size"].values():
        require(v is None or (type(v) is int and v > 0), "Group limits must be positive integers or null")
    low, high = p["group_size"]["min_students"], p["group_size"]["max_students"]
    require(low is None or high is None or low <= high, "Group limits reversed")
    _keys(p["verification"], {"status", "verified_on", "source_updated_on", "notes"}, "verification")
    require(p["verification"]["status"] in {"verified", "verified_with_unknown_fields",
            "pending_verification", "conflicting"}, "Invalid verification status")
    for key in ("verified_on", "source_updated_on"):
        require(p["verification"][key] is None or iso_date(p["verification"][key]), "Invalid review date")
    require(isinstance(p["verification"]["notes"], list)
            and all(nonempty(n) for n in p["verification"]["notes"]), "Invalid verification notes")
    require(isinstance(p["sources"], list) and bool(p["sources"]), "Sources required")
    source_ids = set()
    for source in p["sources"]:
        _keys(source, {"source_id", "url", "title", "source_type", "access_method", "accessed_on"}, "source")
        require(all(nonempty(source[k]) for k in source), "Source fields must be populated")
        require(source["source_id"] not in source_ids, "Duplicate source id")
        source_ids.add(source["source_id"])
        require(canonical_url(source["url"]) == canonical_url(p["official_url"]), "Source URL/program mismatch")
        require(source["source_type"] == "official_program_page", "Unsupported source type")
        require(iso_date(source["accessed_on"]), "Invalid source access date")
    require(isinstance(p["field_evidence"], dict), "field_evidence must be an object")
    for pointer, evidence in p["field_evidence"].items():
        value = resolve_pointer(p, pointer)
        _keys(evidence, {"source_id", "locator", "status", "note"}, "evidence")
        require(evidence["source_id"] in source_ids, "Unresolved evidence source")
        require(evidence["status"] in EVIDENCE_STATUSES, "Invalid evidence status")
        require(nonempty(evidence["locator"]) and nonempty(evidence["note"]), "Evidence context required")
        require(not (value is None and evidence["status"] in TRUSTED_STATUSES), "Null cannot be verified")
        require(not (value is not None and not isinstance(value, (dict, list))
                and evidence["status"] == "unknown"), "Known scalar marked unknown")
    for field in FACT_FIELDS:
        require(evidence_for(p, "/" + field) is not None, "Missing evidence for " + field)
    expected_grades = in_scope_grades(p["grade_levels"]) if is_verified(p, "/grade_levels") else None
    require(scoped == expected_grades, "Normalized grades disagree with trusted published labels")
    standards = p["published_standards"]
    require(standards is None or (isinstance(standards, list) and bool(standards)), "Standards must be null or nonempty list")
    for standard in standards or []:
        _keys(standard, {"framework", "code", "statement", "source_id"}, "standard")
        require(standard["source_id"] in source_ids, "Standard source does not resolve")
        require(all(standard[k] is None or nonempty(standard[k]) for k in ("framework", "code", "statement")),
                "Invalid standard value")
        require(nonempty(standard["code"]) or nonempty(standard["statement"]), "Empty standard")
    require(isinstance(p["unknown_fields"], list), "unknown_fields must be a list")
    unknowns = []
    for unknown in p["unknown_fields"]:
        _keys(unknown, {"field", "reason", "next_step"}, "unknown")
        require(resolve_pointer(p, unknown["field"]) is None, "Declared unknown is not null")
        require(nonempty(unknown["reason"]) and nonempty(unknown["next_step"]), "Unknown reason/action required")
        unknowns.append(unknown["field"])
    require(len(unknowns) == len(set(unknowns)), "Duplicate unknown pointer")
    require(set(unknowns) == null_pointers(p), "Null fields and unknown inventory disagree")
    return p

def validate_catalog(data):
    _keys(data, {"schema_version", "dataset_id", "project_name", "stage", "target_program_count",
                "curated_on", "date_timezone", "primary_catalog_url", "coverage_note", "programs"}, "catalog")
    require(data["schema_version"] == "1.0.0", "Unsupported catalog schema version")
    require(type(data["stage"]) is int and data["stage"] in {1, 2}, "Invalid stage")
    require(type(data["target_program_count"]) is int and data["target_program_count"] > 0, "Invalid target count")
    require(iso_date(data["curated_on"]), "Invalid curation date")
    for key in ("dataset_id", "project_name", "date_timezone", "coverage_note"):
        require(nonempty(data[key]), "Missing envelope metadata: " + key)
    canonical_url(data["primary_catalog_url"])
    require(isinstance(data["programs"], list), "programs must be a list")
    ids, urls = set(), set()
    for p in data["programs"]:
        validate_program(p)
        require(p["id"] not in ids, "Duplicate program id")
        url = canonical_url(p["official_url"])
        require(url not in urls, "Duplicate canonical URL")
        ids.add(p["id"]); urls.add(url)
    return data

def _unique_keys(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "Duplicate JSON key: " + key)
        result[key] = value
    return result

def load_catalog(path=None):
    """Read only the requested local JSON file; validate before returning it."""
    try:
        with Path(path or DEFAULT_CATALOG).open(encoding="utf-8") as f:
            data = json.load(f, object_pairs_hook=_unique_keys,
                             parse_constant=lambda x: (_ for _ in ()).throw(CatalogError("Nonfinite JSON number")))
    except (json.JSONDecodeError, OSError) as exc:
        raise CatalogError("Cannot load catalog: " + str(exc)) from exc
    return validate_catalog(data)
