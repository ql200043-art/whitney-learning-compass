"""Two-layer deterministic matching; model output cannot override these decisions."""
import copy
import re
from datetime import date
from decimal import Decimal
from .catalog import (validate_catalog, validate_program, evidence_for, is_verified)
from .grades import normalize_grade, supports_grade

USD_DISCLOSURE = "USD assumed for this Connecticut prototype; not explicitly published by the museum."
OPERATIONAL = {"capacity", "availability", "accessibility", "special_delivery",
               "additional_charges", "booking_conditions"}

def _number(value, name, positive=False):
    if type(value) not in (int, float, Decimal):
        raise ValueError(name + " must be numeric")
    v = Decimal(str(value))
    if not v.is_finite() or v < 0 or (positive and v == 0):
        raise ValueError(name + " must be finite and " + ("positive" if positive else "nonnegative"))
    return v

def validate_requirements(request):
    if not isinstance(request, dict):
        raise ValueError("Requirements must be an object")
    allowed = {"grades", "student_count", "max_program_fee", "budget_currency", "assume_usd",
               "max_duration_minutes", "preferences", "mandatory_operational", "required_standards"}
    if set(request) - allowed:
        raise ValueError("Unknown requirement fields: " + ", ".join(sorted(set(request) - allowed)))
    if "grades" not in request:
        raise ValueError("At least one concrete student grade is required")
    grades = request["grades"] if isinstance(request["grades"], list) else [request["grades"]]
    if not grades:
        raise ValueError("At least one grade is required")
    r = {"grades": sorted(set(normalize_grade(g) for g in grades))}
    count = request.get("student_count")
    if count is not None and (type(count) is not int or count <= 0):
        raise ValueError("student_count must be a positive integer")
    r["student_count"] = count
    budget = request.get("max_program_fee")
    r["max_program_fee"] = None if budget is None else _number(budget, "max_program_fee")
    if budget is not None and count is None:
        raise ValueError("student_count is required for a program-fee budget")
    if r["max_program_fee"] is not None and r["max_program_fee"].as_tuple().exponent < -2:
        raise ValueError("Budget must have at most two decimal places")
    currency = request.get("budget_currency")
    if currency is not None and (not isinstance(currency, str) or not re.fullmatch(r"[A-Z]{3}", currency)):
        raise ValueError("budget_currency must be an uppercase three-letter code or null")
    r["budget_currency"] = currency
    assumption = request.get("assume_usd", False)
    if type(assumption) is not bool:
        raise ValueError("assume_usd must be a boolean")
    r["assume_usd"] = assumption
    duration = request.get("max_duration_minutes")
    r["max_duration_minutes"] = None if duration is None else _number(duration, "max_duration_minutes", True)
    if r["max_duration_minutes"] is not None and r["max_duration_minutes"] > 1440:
        raise ValueError("Workshop duration limit must be at most 1440 minutes")
    for key in ("preferences", "required_standards"):
        values = request.get(key, [])
        if not isinstance(values, list) or any(not isinstance(v, str) or not v.strip() for v in values):
            raise ValueError(key + " must be a list of nonempty strings")
        r[key] = list(dict.fromkeys(v.strip() for v in values))
    ops = request.get("mandatory_operational", {})
    if not isinstance(ops, dict) or set(ops) - OPERATIONAL:
        raise ValueError("Unsupported mandatory operational requirement")
    for key, value in ops.items():
        if key in {"capacity", "additional_charges", "booking_conditions"}:
            if value is not True:
                raise ValueError(key + " must be true when required; omit it otherwise")
        elif key == "availability":
            if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                raise ValueError("availability requires an ISO date")
            date.fromisoformat(value)
        elif not isinstance(value, str) or not value.strip():
            raise ValueError(key + " requires a nonempty requirement description")
    if "capacity" in ops and count is None:
        raise ValueError("student_count is required for mandatory capacity")
    r["mandatory_operational"] = dict(ops)
    return r

def _aggregate(checks):
    statuses = {c["status"] for c in checks}
    return "fail" if "fail" in statuses else "unknown" if "unknown" in statuses else "pass"

def _tokens(text):
    return set(re.findall(r"[a-z0-9]+", text.casefold()))

def _match(p, r):
    constraints = []
    def evidence(*paths):
        return [e for path in paths if (e := evidence_for(p, path)) is not None]
    def check(name, status, reason, paths=(), assumption=None):
        result = {"constraint": name, "status": status, "reason": reason,
                  "evidence": evidence(*paths), "assumption": assumption}
        constraints.append(result)
        return result

    for grade in r["grades"]:
        known = is_verified(p, "/grade_levels")
        ok = supports_grade(p["grade_levels"], grade) if known else None
        check("grade:" + str(grade), "unknown" if ok is None else "pass" if ok else "fail",
              "Published grade labels unavailable or unverified." if ok is None else
              "Grade supported by published labels." if ok else "Grade not supported by published labels.",
              ("/grade_levels",))

    price = p["price"]
    price_known = is_verified(p, "/price/amount") and is_verified(p, "/price/basis") and price["basis"] == "per_student"
    currency = price["currency_code"] if is_verified(p, "/price/currency_code") else None
    assumed = False
    if currency is None and r["assume_usd"] and is_verified(p, "/price/currency_symbol") and price["currency_symbol"] == "$":
        currency, assumed = "USD", True
    subtotal = None
    if price_known and r["student_count"] is not None and currency is not None:
        subtotal = Decimal(str(price["amount"])) * r["student_count"]
    if r["max_program_fee"] is not None:
        budget_currency = r["budget_currency"] or ("USD" if r["assume_usd"] else None)
        if not price_known:
            check("program_fee_budget", "unknown", "Published per-student price is missing or unverified.", ("/price",))
        elif subtotal is None or budget_currency is None or currency != budget_currency:
            check("program_fee_budget", "unknown", "Currency comparison is unsupported; no conversion performed.",
                  ("/price", "/price/currency_code"), USD_DISCLOSURE if assumed else None)
        else:
            ok = subtotal <= r["max_program_fee"]
            check("program_fee_budget", "pass" if ok else "fail",
                  f"Program-fee subtotal {subtotal:.2f} {currency} " + ("is within" if ok else "exceeds") +
                  f" budget {r['max_program_fee']:.2f} {currency}.",
                  ("/price", "/price/currency_code"), USD_DISCLOSURE if assumed else None)

    duration_check = None
    if r["max_duration_minutes"] is not None:
        known = is_verified(p, "/duration/minutes")
        ok = known and Decimal(p["duration"]["minutes"]) <= r["max_duration_minutes"]
        duration_check = check("duration", "unknown" if not known else "pass" if ok else "fail",
              "Published duration is missing or unverified." if not known else
              f"Published duration {p['duration']['minutes']} minutes " +
              ("is within" if ok else "exceeds") + f" limit {r['max_duration_minutes']}.",
              ("/duration",))
    for code in r["required_standards"]:
        # Absence from a non-exhaustive published list cannot prove non-alignment.
        standards = p["published_standards"] or []
        found = is_verified(p, "/published_standards") and any(s["code"] == code for s in standards)
        check("standard:" + code, "pass" if found else "unknown",
              "Exact code is published for this program." if found else "Required standards alignment has not been verified.",
              ("/published_standards",))

    operational = []
    paths = {"capacity": ["/group_size"], "availability": ["/booking_availability"],
             "accessibility": ["/accessibility_notes"], "special_delivery": [],
             "additional_charges": [], "booking_conditions": []}
    for kind in sorted(OPERATIONAL):
        mandatory = kind in r["mandatory_operational"]
        status = "unknown"
        reason = "Requires museum confirmation; the catalog does not establish this operational condition."
        if kind == "capacity" and r["student_count"] is not None:
            low = p["group_size"]["min_students"]; high = p["group_size"]["max_students"]
            low_known = is_verified(p, "/group_size/min_students")
            high_known = is_verified(p, "/group_size/max_students")
            if (low_known and r["student_count"] < low) or (high_known and r["student_count"] > high):
                status, reason = "fail", "Student count violates a verified published group-size limit."
            elif low_known and high_known:
                status, reason = "pass", "Student count fits published group-size limits; date-specific booking is still unconfirmed."
        # Free-text access/availability notes do not verify a specific requested accommodation/date.
        item = {"item": kind, "status": "requires_confirmation", "mandatory": mandatory,
                "requirement": r["mandatory_operational"].get(kind), "reason": reason,
                "published_constraint_status": status, "evidence": evidence(*paths[kind])}
        operational.append(item)
        if mandatory:
            check("operational:" + kind, status, reason, paths[kind])

    matches = []
    subject_labels = p["subjects"] if is_verified(p, "/subjects") else []
    searchable = [
        ("/official_name", p["official_name"] if is_verified(p, "/official_name") else ""),
        ("/description", p["description"] if is_verified(p, "/description") else ""),
    ] + [("/subjects", label) for label in subject_labels or []]
    for preference in r["preferences"]:
        words = _tokens(preference)
        hits = [{"field": field, "text": value, "evidence": evidence(field)}
                for field, value in searchable if value and words and words <= _tokens(value)]
        if hits:
            matches.append({"preference": preference, "matches": hits})
    overall = _aggregate(constraints)
    conditional = any(c["assumption"] for c in constraints)
    category = "rejected" if overall == "fail" else "unknown" if overall == "unknown" else "conditional" if conditional else "eligible"
    return {
        "program_id": p["id"], "official_name": p["official_name"], "official_url": p["official_url"],
        "eligibility_status": overall, "classification": category,
        "hard_constraints": constraints,
        "program_fee": {"published": copy.deepcopy(price),
                        "subtotal": f"{subtotal:.2f}" if subtotal is not None else None,
                        "currency": currency, "currency_assumption": USD_DISCLOSURE if assumed else None,
                        "student_count": r["student_count"],
                        "additional_trip_costs": None, "total_trip_cost": None},
        "duration": {**p["duration"], "requested_limit": str(r["max_duration_minutes"]) if r["max_duration_minutes"] is not None else None,
                     "check_status": duration_check["status"] if duration_check else "not_requested"},
        "topic_score": len(matches), "matched_preferences": matches,
        "matched_subjects": sorted({hit["text"] for m in matches for hit in m["matches"] if hit["field"] == "/subjects"}),
        "operational_confirmation": operational, "booking_confirmed": False,
        "reasons": [c["reason"] for c in constraints if c["status"] in {"fail", "unknown"}],
        "data_quality_warnings": list(p["verification"]["notes"]) +
            [u["field"] + ": " + u["reason"] for u in p["unknown_fields"]],
        "evidence": copy.deepcopy(p["sources"]),
    }

def match_program(program, requirements):
    """Validate one trusted catalog entry and return its explainable decision."""
    validate_program(program)
    return _match(program, validate_requirements(requirements))

def match_catalog(catalog, requirements):
    """Return every real catalog entry, ordered by eligibility, then transparent topic score."""
    validate_catalog(catalog)
    request = validate_requirements(requirements)
    results = [_match(p, request) for p in catalog["programs"]]
    order = {"pass": 0, "unknown": 1, "fail": 2}
    return sorted(results, key=lambda r: (order[r["eligibility_status"]], -r["topic_score"], r["program_id"]))
