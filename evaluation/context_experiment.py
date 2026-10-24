"""Opt-in, bounded paired experiment using unchanged production agent builders.
No application imports this module. --live is mandatory for provider access.
"""
import argparse, asyncio, fcntl, hashlib, json, time
from pathlib import Path
from uuid import uuid4
from pydantic_ai.usage import UsageLimits
from pydantic_ai.messages import ToolCallPart, RetryPromptPart
from backend.agents import Context, compact, build_advisor, build_designer
from backend.config import MODEL, MAX_TOOLS, RUN_TIMEOUT
from backend.gateway import course_model, timestamp, usage_totals, safe_error, ExecutionLimit
from backend.models import TeacherRequest
from backend.safety import redact, OutputRejected
from backend.validation import validate_advisor, validate_journey
from matching import load_catalog, match_catalog
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'artifacts/stage5'
CAP=24
class Budget:
    def __init__(self,path):self.path=Path(path)
    def reserve(self):
        self.path.parent.mkdir(parents=True,exist_ok=True)
        with self.path.open('a+') as f:
            fcntl.flock(f,fcntl.LOCK_EX);f.seek(0);text=f.read()
            d=json.loads(text) if text else {'limit':CAP,'used':0,'reservations':[]}
            if d['limit']!=CAP or d['used']>=CAP:raise ExecutionLimit('Evaluation batch request cap')
            d['used']+=1;d['reservations'].append({'number':d['used'],'timestamp':timestamp()})
            f.seek(0);f.truncate();f.write(json.dumps(d,indent=2)+'\n');f.flush()
            return d['used']

class ExperimentalContext(Context):
    condition='shortlist'
    def emit(self,name,args,result):
        if name=='search_matching_programs' and self.condition=='full':
            matches=match_catalog(self.catalog,self.teacher.matching_input())
            result=[compact(self.program(m['program_id']),m) for m in matches]
        return super().emit(name,args,result)

async def run_one(sid,condition,teacher,selected=None,consent=None):
    role='Learning Journey Designer' if selected else 'Program Advisor'
    label=f'{sid}-{condition}-'+('designer' if selected else 'advisor')
    path=OUT/(label+'.json')
    if path.exists():raise SystemExit('Existing attempt retained; refusing automatic rerun: '+label)
    trace={'run_id':str(uuid4()),'timestamp':timestamp(),'scenario':sid,'condition':condition,
      'agent':role,'execution_kind':'real_portkey','requested_model':MODEL,'model_requests':[],
      'tools':[],'model_tool_calls':[],'retries':0,'status':'running','output_validation':'pending',
      'teacher_request':teacher.model_dump(mode='json'),'selection':consent,'course_cost':None}
    catalog=load_catalog();programs={p['id']:p for p in catalog['programs']}
    matches={m['program_id']:m for m in match_catalog(catalog,teacher.matching_input())}
    trace['catalog_sha256']=hashlib.sha256((ROOT/'data/programs.json').read_bytes()).hexdigest()
    ctx=ExperimentalContext(catalog,teacher,trace,selected);ctx.condition=condition
    budget=Budget(OUT/'request_budget.json');started=time.monotonic();draft=None
    try:
        async with asyncio.timeout(RUN_TIMEOUT):
            async with course_model(trace) as model:
                # Add global accounting to the actual production HTTP client, without
                # changing its gateway/model/auth/retry or per-request safety hooks.
                http=model.client._client
                async def reserve(request):
                    if len(trace['model_requests'])>=3:raise ExecutionLimit('Evaluation per-agent request cap')
                    number=budget.reserve();trace['last_batch_request_number']=number
                async def extra(response):
                    if response.is_success:
                        body=response.json();u=body.get('usage') or {};details=u.get('prompt_tokens_details') or {}
                        trace['model_requests'][-1].update(provider_response_id=body.get('id'),
                          cache_write_tokens=details.get('cache_write_tokens'),
                          provider_usage_details={k:v for k,v in details.items() if isinstance(v,(int,float,type(None)))})
                http.event_hooks['request'].insert(0,reserve)
                http.event_hooks['response'].append(extra)
                agent=(build_designer if selected else build_advisor)(model)
                result=await agent.run(json.dumps({'educator_data':teacher.model_dump(),'selected_program_id':selected},ensure_ascii=False),deps=ctx,
                  usage_limits=UsageLimits(request_limit=3,tool_calls_limit=MAX_TOOLS,input_tokens_limit=32000,output_tokens_limit=6500))
                draft=result.output;trace['output']=draft.model_dump(mode='json')
                trace['pydantic_usage']={k:v for k,v in result.usage.__dict__.items() if not k.startswith('_')}
                for message in result.all_messages():
                    for part in message.parts:
                        if isinstance(part,ToolCallPart):trace['model_tool_calls'].append({'tool':part.tool_name,'tool_call_id':part.tool_call_id,'arguments':part.args_as_dict() if part.tool_name!='final_result' else {'structured_output':'see output'}})
                        if isinstance(part,RetryPromptPart):trace['retries']+=1
                tools=[t['tool'] for t in trace['tools']]
                if selected:
                    validate_journey(draft,programs[selected],tools)
                    trace['accepted_plan']=draft.model_dump(mode='json')
                    trace['selected_eligibility']=matches[selected]
                else:
                    choices=validate_advisor(draft,programs,matches,tools)
                    trace['accepted_choices']=[c.model_dump(mode='json') for c in choices]
                trace.update(status='passed',output_validation='passed')
    except Exception as exc:
        code,status,message=safe_error(exc)
        if isinstance(exc,OutputRejected):code='invalid_model_output';message='Independent validation rejected the output.';trace['validation_failure']=str(exc)
        trace.update(status='failed',output_validation='failed',error={'code':code,'message':message,'exception_type':type(exc).__name__})
    finally:
        trace['latency_seconds']=round(time.monotonic()-started,3)
        trace['usage']=usage_totals(trace['model_requests']);trace['model_request_count']=len(trace['model_requests'])
        writes=[r.get('cache_write_tokens') for r in trace['model_requests']]
        trace['cache_write_tokens']=sum(writes) if writes and all(type(x)==int for x in writes) else None
        path.write_text(json.dumps(redact(trace),indent=2)+'\n')
        print(label,trace['status'],trace['usage'],'requests',trace['model_request_count'],flush=True)
    return trace

async def main(args):
    if not args.live:raise SystemExit('No inference by default. Explicit --live required; maximum batch 24 requests.')
    if not (OUT/'usage_audit.json').exists():raise SystemExit('Audit historical usage first.')
    # Hold batch lock so two experiment commands cannot race or silently retry attempts.
    with (ROOT/'.runtime/stage5-experiment.lock').open('a+') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        scenarios=json.loads((OUT/'evaluation_scenarios.json').read_text())['scenarios']
        if args.phase=='advisors':
            for sid,order in [('A01',['full','shortlist']),('A02',['shortlist','full']),('A03',['full','shortlist'])]:
                s=next(s for s in scenarios if s['id']==sid);teacher=TeacherRequest(**s['teacher_request'])
                for condition in order:
                    row=await run_one(sid,condition,teacher)
                    if row['status']!='passed':return # Preserve failure; do not blindly repeat.
        else:
            if not args.selection:raise SystemExit('Explicit user selection JSON is required.')
            consent=json.loads(Path(args.selection).read_text());pid=consent['program_id']
            if consent.get('teacher_selected') is not True or not consent.get('user_reply'):raise SystemExit('Missing human selection evidence')
            teacher=TeacherRequest(**scenarios[0]['teacher_request'])
            for condition in ('full','shortlist'):
                advisor=json.loads((OUT/f'A01-{condition}-advisor.json').read_text())
                offered={c['program_id']:c for c in advisor.get('accepted_choices',[])}
                if pid not in offered or offered[pid]['category']!='eligible':raise SystemExit('Selection must be an eligible choice in both actual outputs')
                if advisor['catalog_sha256']!=hashlib.sha256((ROOT/'data/programs.json').read_bytes()).hexdigest():raise SystemExit('Catalog changed')
                row=await run_one('A01',condition,teacher,pid,consent)
                if row['status']!='passed':return
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--live',action='store_true');parser.add_argument('--phase',choices=['advisors','designers'],default='advisors');parser.add_argument('--selection')
    asyncio.run(main(parser.parse_args()))
