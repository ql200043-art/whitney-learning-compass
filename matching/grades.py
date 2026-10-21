"""Concrete US school grades; museum 7+ has no asserted upper program limit."""
import re

def normalize_grade(value):
    if type(value) is int:
        if -1 <= value <= 12:
            return value
    elif isinstance(value, str):
        token = value.strip().casefold()
        if token in {"prek", "pre-k"}:
            return -1
        if token in {"k", "kindergarten"}:
            return 0
        if re.fullmatch(r"[1-9]|1[0-2]", token):
            return int(token)
    raise ValueError("Grade must be PreK, K/Kindergarten, or a concrete integer grade 1–12; 7+ is a catalog label.")

def supports_grade(labels, grade):
    """Use published labels only. Input range is an API limit, not a museum maximum."""
    if labels is None:
        return None
    label = "PreK" if grade == -1 else "K" if grade == 0 else str(grade)
    return label in labels or (grade >= 7 and "7+" in labels)

def in_scope_grades(labels):
    return None if labels is None else [g for g in range(2, 8) if supports_grade(labels, g)]
