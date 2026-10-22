"""Guarded OpenAI-compatible Chat Completions transport and observed usage."""
import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import httpx
from openai import AsyncOpenAI
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from .config import credentials, MODEL, GATEWAY, MAX_REQUESTS, MAX_CONTEXT_BYTES, HTTP_TIMEOUT

class ExecutionLimit(RuntimeError):
    pass

def timestamp():
    return datetime.now(timezone.utc).isoformat()

def usage_totals(requests):
    def total(field):
        values = [r.get(field) for r in requests]
        return sum(values) if values and all(isinstance(v, int) for v in values) else None
    return {k: total(k) for k in ("input_tokens", "cached_input_tokens", "output_tokens")}

@asynccontextmanager
async def course_model(trace):
    key, virtual_key = credentials()
    async def guard(request):
        if str(request.url) != GATEWAY + "/chat/completions" or request.method != "POST":
            raise ExecutionLimit("Gateway endpoint restriction")
        body = json.loads(request.content)
        if body.get("model") != MODEL or body.get("reasoning_effort") != "none":
            raise ExecutionLimit("Model/settings restriction")
        if len(request.content) > MAX_CONTEXT_BYTES:
            raise ExecutionLimit("Context byte limit")
        if len(trace["model_requests"]) >= MAX_REQUESTS:
            raise ExecutionLimit("Model request limit")
        trace["model_requests"].append({"timestamp": timestamp(), "requested_model": MODEL,
            "reported_model": None, "http_status": None, "input_tokens": None,
            "cached_input_tokens": None, "output_tokens": None})
    async def observe(response):
        row = trace["model_requests"][-1]
        row["http_status"] = response.status_code
        await response.aread()
        if response.is_success:
            body = response.json()
            usage = body.get("usage") or {}
            row.update(reported_model=body.get("model"), input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
                cached_input_tokens=(usage.get("prompt_tokens_details") or {}).get("cached_tokens"))
            reported=body.get("model")
            if not isinstance(reported,str) or not (reported==MODEL or reported.startswith(MODEL+"-")):
                raise ExecutionLimit("Provider-reported model does not match the allowed model")
    headers = {"x-portkey-api-key": key, "x-portkey-provider": "openai"}
    if virtual_key:
        headers["x-portkey-virtual-key"] = virtual_key
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=False,
            event_hooks={"request": [guard], "response": [observe]}) as http:
        client = AsyncOpenAI(api_key=key, base_url=GATEWAY, default_headers=headers,
                             max_retries=0, http_client=http)
        yield OpenAIChatModel(MODEL, provider=OpenAIProvider(openai_client=client))

def safe_error(exc):
    # Intentionally never serialize str(exc), response bodies, headers or tracebacks.
    from .config import ConfigurationError
    from pydantic_ai.exceptions import ModelHTTPError, UsageLimitExceeded, UnexpectedModelBehavior
    from openai import APITimeoutError, APIConnectionError
    from pydantic_ai.exceptions import ModelAPIError
    cause=exc
    seen=set()
    while cause is not None and id(cause) not in seen:
        seen.add(id(cause))
        if isinstance(cause,(ExecutionLimit,UsageLimitExceeded)):
            return "execution_limit",429,"The bounded execution limit was reached; no result was accepted."
        cause=cause.__cause__
    if isinstance(exc, ModelAPIError) and not isinstance(exc, ModelHTTPError) and exc.__cause__ is not None:
        return safe_error(exc.__cause__)
    if isinstance(exc, ConfigurationError):
        return "missing_configuration", 503, "Set the course PORTKEY_API_KEY in the process, project .env, or parent .env."
    if isinstance(exc, (TimeoutError, APITimeoutError, httpx.TimeoutException)):
        return "provider_timeout", 504, "The model request timed out; no result was accepted."
    if isinstance(exc, (ExecutionLimit, UsageLimitExceeded)):
        return "execution_limit", 429, "The bounded execution limit was reached; no result was accepted."
    if isinstance(exc, ModelHTTPError):
        return "provider_unavailable", 502, f"The course gateway returned HTTP {exc.status_code}; no fallback was used."
    if isinstance(exc, APIConnectionError):
        return "provider_connection", 502, "Could not connect to the course gateway; no fallback was used."
    if isinstance(exc, UnexpectedModelBehavior):
        return "invalid_model_output", 502, "The model did not return an acceptable structured result."
    return "workflow_failed", 500, "The workflow could not complete safely."

