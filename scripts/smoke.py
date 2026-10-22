"""Explicit live tool-call smoke test; never run by pytest."""
import asyncio
import json
import time
from pathlib import Path
from uuid import uuid4
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.usage import UsageLimits
from backend.config import ROOT, MODEL
from backend.gateway import course_model, timestamp, usage_totals, safe_error

class Answer(BaseModel):
    value: int

async def main():
    trace = {"run_id": str(uuid4()), "timestamp": timestamp(), "execution_kind": "real_portkey",
             "agent": "connectivity_smoke", "model": MODEL, "model_requests": [], "tools": []}
    started = time.monotonic()
    try:
        async with course_model(trace) as model:
            agent = Agent(model, output_type=Answer, retries=0,
                          model_settings={"openai_reasoning_effort": "none", "max_tokens": 300})
            @agent.tool_plain
            def verified_example_fee() -> int:
                """Return a fixed arithmetic smoke-test value; not a live museum quote."""
                trace["tools"].append({"tool": "verified_example_fee", "arguments": {}, "result": 336})
                return 336
            result = await asyncio.wait_for(agent.run("Call verified_example_fee and return its value.",
                usage_limits=UsageLimits(request_limit=3, tool_calls_limit=1)), timeout=60)
            assert result.output.value == 336 and trace["tools"]
            trace.update(status="passed", output=result.output.model_dump(),
                         pydantic_usage={k:v for k,v in result.usage.__dict__.items() if not k.startswith('_')})
    except Exception as exc:
        code, status, message = safe_error(exc)
        trace.update(status="failed", error={"code": code, "http_status": status, "message": message,
                                           "exception_type": type(exc).__name__})
    trace.update(usage=usage_totals(trace["model_requests"]), latency_seconds=round(time.monotonic()-started,3))
    directory=ROOT/"artifacts/agent_runs"; directory.mkdir(parents=True,exist_ok=True)
    path=directory/("smoke-"+trace["run_id"]+".json")
    path.write_text(json.dumps(trace,indent=2,default=str)+"\n")
    print(json.dumps({"artifact":str(path.relative_to(ROOT)),**trace},indent=2,default=str))
    return trace["status"] == "passed"

if __name__ == "__main__":
    raise SystemExit(0 if asyncio.run(main()) else 1)

