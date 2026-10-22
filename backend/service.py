"""Bounded sequential orchestration with an explicit human-selection boundary."""
import asyncio
import copy
import hashlib
import json
import secrets
import time
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4
from pydantic_ai.usage import UsageLimits
from pydantic_ai.messages import ModelResponse, ToolCallPart, RetryPromptPart
from matching import load_catalog, match_catalog, match_program
from .agents import Context, build_advisor, build_designer
from .models import TeacherRequest, JourneyRequest, RecommendationResponse, JourneyResponse
from .validation import validate_advisor, validate_journey, facts
from .safety import OutputRejected, guard_source, redact
from .gateway import course_model, timestamp, usage_totals, safe_error
from .config import ROOT, MODEL, MAX_REQUESTS, MAX_TOOLS, RUN_TIMEOUT

class WorkflowError(Exception):
    def __init__(self, code, message, status=422, run_id=None):
        self.code, self.message, self.status, self.run_id = code, message, status, run_id

def digest(catalog):
    return hashlib.sha256(json.dumps(catalog,sort_keys=True).encode()).hexdigest()

@dataclass
class Workflow:
    teacher: TeacherRequest
    token: str
    catalog_digest: str
    choices: dict
    created: float
    journey_started: bool = False

class Service:
    """Local single-process service. Test model factories are dependency injection only."""
    def __init__(self, model_factory=None, catalog_loader=load_catalog, log_dir=ROOT/".runtime"/"runs", timeout=RUN_TIMEOUT):
        self.model_factory=model_factory
        self.catalog_loader=catalog_loader
        self.log_dir=log_dir
        self.timeout=timeout
        self.workflows={}
        self.runs={}
        self.run_tokens={}
        self.busy=asyncio.Semaphore(2)

    def _catalog(self):
        catalog=self.catalog_loader()
        for p in catalog["programs"]:
            guard_source(p)
        return catalog

    def _expire(self):
        now=time.monotonic()
        expired=[key for key,w in self.workflows.items() if now-w.created>3600]
        for key in expired:
            del self.workflows[key]
        for run_id in list(self.runs):
            if self.runs[run_id]["workflow_id"] not in self.workflows:
                del self.runs[run_id]
                self.run_tokens.pop(run_id,None)

    def _trace(self, role, workflow_id):
        return {"run_id":str(uuid4()),"workflow_id":workflow_id,"timestamp":timestamp(),
            "agent":role,"execution_kind":"simulated_test" if self.model_factory else "real_portkey",
            "model":MODEL if not self.model_factory else "test_model",
            "model_requests":[],"model_tool_calls":[],"tools":[],
            "input_validation":"passed","output_validation":"pending","status":"running",
            "retries":0,"cost":None,"cost_note":"Course gateway pricing not verified; no cost inferred."}

    async def _run(self, role, context, trace):
        agent_builder=build_advisor if role=="Program Advisor" else build_designer
        async def invoke(model):
            agent=agent_builder(model)
            prompt=json.dumps({"educator_data":context.teacher.model_dump(),
                               "selected_program_id":context.selected_id},ensure_ascii=False)
            result=await agent.run(prompt,deps=context,usage_limits=UsageLimits(
                request_limit=MAX_REQUESTS,tool_calls_limit=MAX_TOOLS,
                input_tokens_limit=32000,output_tokens_limit=6500))
            trace["pydantic_usage"]={k:v for k,v in result.usage.__dict__.items() if not k.startswith("_")}
            for message in result.all_messages():
                for part in message.parts:
                    if isinstance(part,ToolCallPart):
                        # Record actual model calls, never fabricated agent actions.
                        trace["model_tool_calls"].append({"tool":part.tool_name,"tool_call_id":part.tool_call_id,
                            "arguments":redact(part.args_as_dict()) if part.tool_name!="final_result" else {"structured_output":"recorded in validated response"}})
                    if isinstance(part,RetryPromptPart):
                        trace["retries"]+=1
            if self.model_factory:
                trace["simulated_usage"]=trace["pydantic_usage"]
            return result.output
        async with asyncio.timeout(self.timeout):
            if self.model_factory:
                return await invoke(self.model_factory(role,context))
            async with course_model(trace) as model:
                return await invoke(model)

    def _finish(self, trace, started, token):
        trace["latency_seconds"]=round(time.monotonic()-started,3)
        trace["model_request_count"]=len(trace["model_requests"])
        trace["usage"]=usage_totals(trace["model_requests"])
        clean=redact(trace)
        self.runs[trace["run_id"]]=clean
        self.run_tokens[trace["run_id"]]=token
        if self.log_dir is not None:
            self.log_dir.mkdir(parents=True,exist_ok=True)
            # Local runtime metadata is ignored by Git; representative exports are deliberate.
            (self.log_dir/(trace["run_id"]+".json")).write_text(json.dumps(clean,indent=2)+"\n")

    def _failure(self, exc, trace):
        if isinstance(exc,OutputRejected):
            code,status,message="invalid_model_output",502,"Independent output validation rejected the result."
            trace["validation_failure"]=str(exc) # Only our fixed validator messages, never provider text.
        else:
            code,status,message=safe_error(exc)
        trace.update(status="failed",output_validation="failed",
                     error={"code":code,"message":message,"exception_type":type(exc).__name__})
        return WorkflowError(code,message,status,trace["run_id"])

    async def recommend(self, teacher):
        self._expire()
        if len(self.workflows)>=100 or self.busy.locked():
            raise WorkflowError("service_capacity","Local workflow capacity reached; retry later.",429)
        try:
            catalog=self._catalog()
            matches=match_catalog(catalog,teacher.matching_input())
        except (ValueError,OutputRejected):
            raise WorkflowError("invalid_catalog","The local catalog failed validation.",503) from None
        workflow_id=str(uuid4()); token=secrets.token_urlsafe(32)
        trace=self._trace("Program Advisor",workflow_id);started=time.monotonic()
        context=Context(catalog,teacher,trace)
        draft=None
        async with self.busy:
            try:
                draft=await self._run("Program Advisor",context,trace)
                programs={p["id"]:p for p in catalog["programs"]}
                choices=validate_advisor(draft,programs,{m["program_id"]:m for m in matches},
                                         [t["tool"] for t in trace["tools"]])
                self.workflows[workflow_id]=Workflow(teacher.model_copy(deep=True),token,digest(catalog),
                    {c.program_id:c.category for c in choices},time.monotonic())
                trace.update(status="passed",output_validation="passed",final_program_ids=[c.program_id for c in choices])
                eligible=[c for c in choices if c.category=="eligible"]
                provisional=[c for c in choices if c.category=="provisional"]
                message=("Review these options and explicitly select a program. Booking remains unconfirmed."
                    if eligible else "No fully eligible recommendation was returned. Any provisional options require confirmation.")
                return RecommendationResponse(workflow_id=workflow_id,workflow_token=token,run_id=trace["run_id"],
                    interpreted_goal=draft.interpreted_goal,recommendations=eligible,provisional_options=provisional,
                    eligibility_results=matches,message=message)
            except Exception as exc:
                if isinstance(exc,OutputRejected) and draft is not None:
                    trace["rejected_output"]=redact(draft.model_dump())
                raise self._failure(exc,trace) from None
            finally:
                self._finish(trace,started,token)

    def authorize(self, workflow_id, token):
        self._expire()
        workflow=self.workflows.get(str(workflow_id))
        if not workflow or not token or not secrets.compare_digest(workflow.token,token):
            raise WorkflowError("workflow_not_found","Workflow missing, expired, or selection token invalid.",404)
        return workflow

    async def journey(self, selection, token):
        workflow=self.authorize(selection.workflow_id,token)
        if selection.program_id not in workflow.choices:
            raise WorkflowError("invalid_selection","Select a candidate returned by this recommendation workflow.")
        if workflow.journey_started:
            raise WorkflowError("workflow_consumed","This workflow already used its journey attempt; request new recommendations.",409)
        catalog=self._catalog()
        if digest(catalog)!=workflow.catalog_digest:
            raise WorkflowError("catalog_changed","Catalog changed; request new recommendations.",409)
        p=next(p for p in catalog["programs"] if p["id"]==selection.program_id)
        match=match_program(p,workflow.teacher.matching_input())
        if match["eligibility_status"]=="fail":
            raise WorkflowError("rejected_selection","The selected program fails a hard requirement.")
        provisional=match["eligibility_status"]=="unknown"
        if provisional and not selection.acknowledge_unknown:
            raise WorkflowError("acknowledgment_required","Explicitly acknowledge unresolved requirements to create a provisional draft.")
        if self.busy.locked():
            raise WorkflowError("service_capacity","Local workflow capacity reached; retry later.",429)
        workflow.journey_started=True
        trace=self._trace("Learning Journey Designer",str(selection.workflow_id));started=time.monotonic()
        trace["human_selection"]={"program_id":selection.program_id,"teacher_selected":True,
                                  "acknowledge_unknown":selection.acknowledge_unknown}
        context=Context(catalog,workflow.teacher,trace,p["id"])
        draft=None
        async with self.busy:
            try:
                draft=await self._run("Learning Journey Designer",context,trace)
                validate_journey(draft,p,[t["tool"] for t in trace["tools"]])
                questions=[f"Confirm {item['item'].replace('_',' ')} with the museum."
                           for item in match["operational_confirmation"]]
                questions+=match["reasons"]+p["verification"]["notes"]
                plan_id=str(uuid4())
                trace.update(status="passed",output_validation="passed",final_plan_id=plan_id)
                return JourneyResponse(workflow_id=selection.workflow_id,run_id=trace["run_id"],plan_id=plan_id,
                    program_id=p["id"],provisional=provisional,museum_facts=facts(p),eligibility=match,
                    ai_teaching_suggestions=draft,
                    suggestion_label="AI-generated editable suggestions for educator review; not museum curriculum or endorsement.",
                    assumptions=[x for x in [match["program_fee"]["currency_assumption"],
                        "Provisional draft: mandatory requirements remain unresolved." if provisional else None] if x],
                    questions_for_museum=questions,
                    safety_notice="Educator review required. Follow museum staff procedures; do not independently operate equipment or substitute projectiles. Use only approved activities and materials.")
            except Exception as exc:
                if isinstance(exc,OutputRejected) and draft is not None:
                    trace["rejected_output"]=redact(draft.model_dump())
                raise self._failure(exc,trace) from None
            finally:
                self._finish(trace,started,token)

    def run_record(self,run_id,token):
        self._expire()
        if run_id not in self.runs or not token or not secrets.compare_digest(self.run_tokens[run_id],token):
            raise WorkflowError("run_not_found","Run missing, expired, or access token invalid.",404)
        return copy.deepcopy(self.runs[run_id])

