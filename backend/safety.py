"""Small deterministic guards; not a claim of complete semantic safety."""
import json
import os
import re

class OutputRejected(ValueError):
    pass

INJECTION = re.compile(r"(?i)(ignore (?:all |the )?(?:previous|prior|system|instructions|constraints)|"
    r"system prompt|developer message|reveal.{0,30}(?:key|secret)|PORTKEY_API_KEY|"
    r"override.{0,30}(?:eligibility|budget|validation)|<\/?(?:system|assistant)>|"
    r"send.{0,30}(?:secret|credential))")
UNSAFE = re.compile(r"(?i)(without (?:adult )?supervision|unsupervised|bypass.{0,15}safety|"
    r"aim.{0,15}(?:people|students|faces)|metal projectiles|mains electricity|"
    r"independently.{0,15}(?:operate|use).{0,15}(?:saw|drill|equipment)|power tools)")
PRIVATE = re.compile(r"(?i)([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|"
                     r"\b\d{3}[-.]\d{3}[-.]\d{4}\b|\bsk-[A-Za-z0-9_-]{16,})")
FACT_CLAIM = re.compile(r"(?i)(\$\s*\d|\b(?:USD|EUR|CAD)\s*\d|\b\d+(?:\.\d+)?\s*[- ]?(?:minutes?|hours?|dollars?)\b|"
    r"\b(?:K|[1-9]|MS|HS)-(?:PS|LS|ESS|ETS)\d?[-.]\w+|"
    r"\b(?:museum|workshop|instructor|staff) (?:will|guarantees|provides|supplies|includes)\b|"
    r"\b(?:booking|availability|capacity|accessibility) (?:is |are )?(?:confirmed|guaranteed)|"
    r"\b(?:museum.approved|officially aligned|free admission|all materials provided)\b|https?://)")

def guard_input(text):
    if any(os.environ.get(k) and os.environ[k] in text for k in ("PORTKEY_API_KEY","PORTKEY_VIRTUAL_KEY")):
        raise ValueError("Do not include credentials in educator input")
    if INJECTION.search(text) or UNSAFE.search(text) or PRIVATE.search(text):
        raise ValueError("Use class-level educational needs only; omit secrets, identifying details, unsafe activities and instruction overrides.")

def guard_source(program):
    # Source text is data, never instructions. Fail closed on recognizable injections.
    if INJECTION.search(json.dumps(program, ensure_ascii=False)):
        raise OutputRejected("Source instruction contamination")

def guard_suggestions(value):
    text = json.dumps(value, ensure_ascii=False)
    if INJECTION.search(text) or UNSAFE.search(text) or PRIVATE.search(text) or FACT_CLAIM.search(text):
        raise OutputRejected("Generated text contains a prohibited factual, private or unsafe claim")

def redact(value):
    if isinstance(value, dict):
        return {k: ("[REDACTED]" if k.lower() in {"workflow_token","authorization","api_key","portkey_api_key","portkey_virtual_key"}
                    else redact(v)) for k,v in value.items()}
    if isinstance(value, list):
        return [redact(v) for v in value]
    if isinstance(value, str):
        for key in ("PORTKEY_API_KEY", "PORTKEY_VIRTUAL_KEY"):
            secret=os.environ.get(key)
            if secret:
                value=value.replace(secret,"[REDACTED]")
        return PRIVATE.sub("[REDACTED]",value)
    return value

