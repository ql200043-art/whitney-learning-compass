"""Independent evidence consistency, boundary and secret checks. No inference."""
import csv, hashlib, json, os, re, subprocess
from collections import Counter
from decimal import Decimal
from pathlib import Path
from xml.etree import ElementTree
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/stage5'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    checks=[]
    def check(name,condition):
        checks.append({'check':name,'passed':bool(condition)})
        if not condition:raise AssertionError(name)
    json_files=list(OUT.glob('*.json'))
    parsed={p.name:json.loads(p.read_text()) for p in json_files}
    spec=parsed['evaluation_scenarios.json'];res=parsed['evaluation_results.json'];comp=parsed['context_comparison.json']
    check('Frozen scenario hash matches result',sha(OUT/'evaluation_scenarios.json')==res['scenario_sha256'])
    check('Exactly 24 unique scenario IDs preserved',[s['id'] for s in spec['scenarios']]==[r['id'] for r in res['results']] and len({s['id'] for s in spec['scenarios']})==24)
    check('Scenario success denominator recomputed',sum(r['passed'] for r in res['results'])==res['summary']['passed']==24)
    check('All offline scenarios explicitly non-live',all(r['actual']['real_model'] is False for r in res['results']))
    with (OUT/'evaluation_summary.csv').open() as f:rows=list(csv.DictReader(f))
    check('Scenario CSV agrees with JSON',len(rows)==24 and all(row['actual']==r['actual']['outcome'] and row['passed']==str(r['passed']) for row,r in zip(rows,res['results'])))
    decisions=[(r,d) for r in res['results'] for d in r['actual'].get('decisions',[])]
    check('33 specified decisions independently counted',len(decisions)==33 and all(r['expected']==d['eligibility_status'] for r,d in decisions))
    runs=[d for name,d in parsed.items() if re.fullmatch(r'A0[123]-(full|shortlist)-(advisor|designer)\.json',name)]
    reqs=[q for r in runs for q in r['model_requests']]
    check('Request cap and recorded count',len(reqs)==parsed['request_budget.json']['used']==comp['new_gateway_requests']==14 and len(reqs)<=24)
    check('Per-agent limit, no automatic retries',all(len(r['model_requests'])<=3 and r['retries']==0 for r in runs))
    for field in ('input_tokens','cached_input_tokens','output_tokens'):
        check('Observed '+field+' recomputed',sum(q[field] for q in reqs)==comp['reported_transaction_usage'][field])
    check('Only requested course model observed',all(q['requested_model']=='gpt-6-luna' and q['reported_model']=='gpt-6-luna-2026-09-22' for q in reqs))
    check('Cache classes disjoint within input',all(0<=q['cached_input_tokens']+q['cache_write_tokens']<=q['input_tokens'] for q in reqs))
    unique={q['provider_response_id']:q for q in reqs}
    check('Repeated provider payload IDs separately deduplicated',len(unique)==comp['unique_provider_response_ids']==11)
    for pair in comp['pairs']:
        a,b=[parsed[f"{pair['scenario']}-{cond}-advisor.json"] for cond in ('full','shortlist')]
        check(pair['scenario']+' equal teacher requests',a['teacher_request']==b['teacher_request'])
        full=next(t['result'] for t in a['tools'] if t['tool']=='search_matching_programs')
        short=next(t['result'] for t in b['tools'] if t['tool']=='search_matching_programs')
        check(pair['scenario']+' filter loses no nonfailed candidates',short==[p for p in full if p['eligibility_status']!='fail'])
        check(pair['scenario']+' fraction arithmetic',abs(pair['input_reduction_fraction']-(a['usage']['input_tokens']-b['usage']['input_tokens'])/a['usage']['input_tokens'])<1e-12)
    with (OUT/'cost_model.csv').open() as f:costs=list(csv.DictReader(f))
    check('12 historical projection rows, no failed attempt called completed',len(costs)==12 and all(r['basis'].startswith('historical_') for r in costs))
    for r in costs:
        i,c,o=(Decimal(r[k]) for k in ('input_tokens','cached_input_tokens','output_tokens'))
        n=Decimal(r['users'])*Decimal(r['workflows_per_user'])
        low=((i-c)*Decimal('.10')+c*Decimal('.01')+o*Decimal('.50'))/Decimal(1000000)*n
        high=((i-c)*Decimal('.125')+c*Decimal('.01')+o*Decimal('.50'))/Decimal(1000000)*n
        check(r['basis']+' '+r['users']+'/'+r['workflows_per_user']+' cost arithmetic',low==Decimal(r['illustrative_usd_min']) and high==Decimal(r['illustrative_usd_max']) and r['course_gateway_cost']=='unknown')
    for file,count in [('python-tests.xml',222),('harness-tests.xml',6)]:
        tree=ElementTree.parse(OUT/file);suites=list(tree.getroot().iter('testsuite'))
        check(file+' results',sum(int(s.get('tests',0)) for s in suites)==count and all(int(s.get('failures',0))==int(s.get('errors',0))==0 for s in suites))
    check('153 frontend tests passed','153 passed (153)' in (OUT/'frontend-tests.txt').read_text())
    baseline=json.loads((ROOT/'.runtime/stage5_baseline.json').read_text())
    changed=[p for p,digest in baseline.items() if not (ROOT/p).exists() or sha(ROOT/p)!=digest]
    check('All originally tracked files unchanged',not changed)
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    check('Approved checkpoint unchanged',head=='a9ea536ad369fcd3f5abcc63dc0fe7edc3611232')
    check('Main branch',subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='main')
    check('No remotes',not subprocess.check_output(['git','remote'],cwd=ROOT,text=True).strip())
    check('No staged changes',not subprocess.check_output(['git','diff','--cached','--name-only'],cwd=ROOT,text=True).strip())
    files=[ROOT/p for p in subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()]
    allowed_docs={'agent_run_evidence.md','competitor_analysis.md','evaluation_methodology.md','impact_study_protocol.md','safety_evaluation.md','tokenomics_analysis.md','stage5a_b_validation.md','report_evidence_map.md'}
    check('New files confined to evidence scope',all(str(p.relative_to(ROOT)).startswith(('evaluation/','artifacts/stage5/')) or p.parent==ROOT/'docs' and p.name in allowed_docs for p in files))
    # Read configured secrets only into memory; never print their values.
    from backend.config import load_environment
    load_environment()
    secrets=[v for k,v in os.environ.items() if ('KEY' in k or 'TOKEN' in k or 'SECRET' in k) and len(v)>12]
    hits=[]
    for p in files:
        raw=p.read_bytes()
        if any(v.encode() in raw for v in secrets):hits.append(str(p.relative_to(ROOT)))
        if re.search(rb'(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)',raw):hits.append(str(p.relative_to(ROOT)))
    check('No configured secret values or private key patterns in new files',not hits)
    def walk(v):
        if isinstance(v,dict):
            for k,x in v.items():
                if k.lower() in {'workflow_token','authorization','api_key','x-portkey-api-key'}:
                    assert x in (None,'[REDACTED]','<redacted>'),k
                walk(x)
        elif isinstance(v,list):
            for x in v:walk(x)
    for d in parsed.values():walk(d)
    check('Exported JSON has no unredacted capability fields',True)
    badlinks=[]
    for p in (ROOT/'docs').glob('*.md'):
        if p.name not in allowed_docs:continue
        text=p.read_text();check(p.name+' single title and balanced fences',len(re.findall(r'^# ',text,re.M))==1 and len(re.findall(r'^```',text,re.M))%2==0)
        for link in re.findall(r'\]\(([^)]+)\)',text):
            if link.startswith(('http','mailto:','#')):continue
            target=link.split('#')[0]
            if target and not (p.parent/target).exists():badlinks.append((p.name,target))
    check('New documentation local links resolve',not badlinks)
    result={'checked_at':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'checks':checks,'check_count':len(checks),'passed':len(checks),'failed':0,'original_tracked_files_checked':len(baseline),'changed_original_files':changed,'new_files_reviewed':len(files),'head':head,'scope_note':'All edits/tools write under project root; preserved-file hashes cover tracked project files, not a content audit of the entire outside workspace.'}
    (OUT/'integrity_checks.json').write_text(json.dumps(result,indent=2)+'\n')
    print(f'{len(checks)} evidence consistency/security/boundary checks passed; {len(baseline)} original tracked files unchanged.')
if __name__=='__main__':main()
