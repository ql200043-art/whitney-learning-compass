"""Run frozen Stage 5 scenarios offline. Reuses actual service and existing test factories."""
import asyncio, copy, csv, hashlib, importlib.util, json, subprocess
from pathlib import Path
import pydantic_ai.models
from backend.models import TeacherRequest, JourneyRequest
from backend.service import Service, WorkflowError
from backend.safety import redact
from backend.gateway import timestamp
from matching import load_catalog, match_catalog
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'artifacts/stage5'
spec=importlib.util.spec_from_file_location('existing_offline_tests',ROOT/'tests/test_backend.py')
helpers=importlib.util.module_from_spec(spec); spec.loader.exec_module(helpers)

async def execute(s):
    pid=s['target_program_id']; actual={'method':s['execution_method'],'real_model':False}; service=None
    try:
        teacher=TeacherRequest(**s['teacher_request'])
    except ValueError:
        return actual|{'outcome':'input_rejected','error':'Teacher input rejected before agent execution.'}
    if s['execution_method']=='deterministic_matching':
        matches=match_catalog(load_catalog(),teacher.matching_input())
        selected=[m for m in matches if pid=='all' or m['program_id']==pid]
        actual.update(decisions=selected,outcome=selected[0]['eligibility_status'] if pid!='all' else 'fail' if all(m['eligibility_status']=='fail' for m in selected) else 'unexpected_match')
        # Independently expected concrete checks, not derived by calling the matcher twice.
        expected_checks={
            'A01':{'grade:4':'pass','program_fee_budget':'pass','duration':'pass'},
            'B08':{'grade:2':'fail','grade:4':'pass'},
            'B09':{'duration':'fail'},'B10':{'grade:2':'fail','duration':'unknown'},
            'C13':{'duration':'unknown'},'C14':{'duration':'unknown'},
            'C16':{'program_fee_budget':'unknown'}}.get(s['id'],{})
        seen={x['constraint']:x['status'] for x in selected[0]['hard_constraints']}
        actual['explicit_constraint_assertions']=[{'constraint':k,'expected':v,'actual':seen.get(k),'passed':seen.get(k)==v} for k,v in expected_checks.items()]
        if s['id']=='A01':actual['independent_fee_assertion']={'expected':'336.00','actual':selected[0]['program_fee']['subtotal'],'passed':selected[0]['program_fee']['subtotal']=='336.00'}
        return actual
    if s['id']=='B12':
        actual['target_deterministic_decision']=next(m for m in match_catalog(load_catalog(),teacher.matching_input()) if m['program_id']==pid)
    factory=helpers.factory()
    if s['id']=='D19':
        draft=helpers.advisor_output();draft['choices'][0]['educational_reasoning']=s['attack_payload'];factory=helpers.factory(advisor=draft)
    if s['id']=='D21':
        draft=helpers.journey_output();draft['after']['follow_up_activity']=s['attack_payload'];factory=helpers.factory(journey=draft)
    if s['id']=='D22':factory=helpers.factory(loop=True)
    catalog=load_catalog()
    if s['id']=='D18':
        catalog=copy.deepcopy(catalog)
        next(p for p in catalog['programs'] if p['id']==pid)['description']=s['attack_payload']
    service=Service(model_factory=factory,catalog_loader=lambda:catalog,log_dir=None)
    try:
        response=await service.recommend(teacher)
        if s['id'] in ('D21','E23','E24'):
            token=response.workflow_token
            if s['id']=='E23':
                other=await service.recommend(teacher);token=other.workflow_token
            if s['id']=='E24':service.workflows[str(response.workflow_id)].created-=3601
            selection=JourneyRequest(workflow_id=response.workflow_id,program_id=pid,teacher_selected=True)
            try:await service.journey(selection,token)
            except WorkflowError as exc:
                if s['id']!='E24':raise
                proc=subprocess.run(['npm','test','--','src/DraftWorkflow.test.tsx'],cwd=ROOT/'frontend',capture_output=True,text=True)
                (OUT/'draft-safety-tests.txt').write_text(proc.stdout+proc.stderr)
                actual.update(expired_backend_error=exc.code,frontend_exit_code=proc.returncode,frontend_evidence='artifacts/stage5/draft-safety-tests.txt')
                if exc.code=='workflow_not_found' and proc.returncode==0:
                    return actual|{'outcome':'expired_authorization_blocked_and_local_document_tests_pass','traces':redact(list(service.runs.values()))}
                return actual|{'outcome':'unexpected_failure'}
        actual['outcome']='unexpected_acceptance'
        actual['response']=redact(response.model_dump(mode='json'))
    except WorkflowError as exc:
        actual.update(outcome=exc.code,error=exc.message)
    actual['traces']=redact(list(service.runs.values()))
    return actual

async def main():
    pydantic_ai.models.ALLOW_MODEL_REQUESTS=False
    source=OUT/'evaluation_scenarios.json'; frozen=json.loads(source.read_text()); results=[]
    for s in frozen['scenarios']:
        try:actual=await execute(s)
        except Exception as exc:actual={'outcome':'harness_error','exception_type':type(exc).__name__,'real_model':False}
        checks=actual.get('explicit_constraint_assertions',[])
        passed=actual['outcome']==s['expected'] and all(c['passed'] for c in checks) and actual.get('independent_fee_assertion',{'passed':True})['passed']
        row={'id':s['id'],'category':s['category'],'title':s['title'],'expected':s['expected'],'passed':passed,'actual':actual,'evidence':'artifacts/stage5/evaluation_results.json#'+s['id'],'limitation':s['limitation']}
        results.append(row); print(s['id'], 'PASS' if passed else 'FAIL',actual['outcome'])
    decisions=[(r,d) for r in results for d in r['actual'].get('decisions',[])]
    assertions=[c for r in results for c in r['actual'].get('explicit_constraint_assertions',[])]
    data={'executed_at':timestamp(),'scenario_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'catalog_sha256':hashlib.sha256((ROOT/'data/programs.json').read_bytes()).hexdigest(),
        'summary':{'scenarios':len(results),'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'live_calls':0,
        'specified_eligibility_decisions':len(decisions),'correct_eligibility_decisions':sum(d['eligibility_status']==r['expected'] for r,d in decisions),
        'explicit_constraint_assertions':len(assertions),'passed_constraint_assertions':sum(c['passed'] for c in assertions)},'results':results}
    (OUT/'evaluation_results.json').write_text(json.dumps(data,indent=2)+'\n')
    with (OUT/'evaluation_summary.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['id','category','expected','actual','passed','execution_method','real_model','evidence'])
        for r in results:w.writerow([r['id'],r['category'],r['expected'],r['actual']['outcome'],r['passed'],r['actual'].get('method'),False,r['evidence']])
    if data['summary']['failed']:raise SystemExit(1)
if __name__=='__main__':asyncio.run(main())
