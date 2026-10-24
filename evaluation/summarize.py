"""Derive descriptive metrics and explicitly illustrative costs from saved observations."""
import csv,json,statistics
from pathlib import Path
from backend.gateway import timestamp,usage_totals
from backend.validation import validate_refs, facts
from backend.models import EvidenceRef
from matching import load_catalog,match_catalog
from backend.models import TeacherRequest
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'artifacts/stage5'
RATES={'ordinary_input':0.10,'cached_input':0.01,'cache_write':0.125,'output':0.50}
def cost_bounds(usage,writes):
    i,c,o=[usage[k] for k in ('input_tokens','cached_input_tokens','output_tokens')]
    if any(v is None for v in (i,c,o)):return None,None
    assert 0<=c<=i
    def calc(w):
        assert 0<=w<=i-c
        return ((i-c-w)*RATES['ordinary_input']+c*RATES['cached_input']+w*RATES['cache_write']+o*RATES['output'])/1_000_000
    return (calc(0),calc(i-c)) if writes is None else (calc(writes),calc(writes))
def main():
    runs=[json.loads(p.read_text())|{'artifact':str(p.relative_to(ROOT))} for p in sorted(OUT.glob('A0*-*.json')) if p.name.endswith(('-advisor.json','-designer.json'))]
    pairs=[];programs={p['id']:p for p in load_catalog()['programs']};validation={'accepted_choices':0,'correct_labels':0,'valid_ids':0,'valid_references':0,'references':0,'authoritative_fact_checks':0,'authoritative_fact_checks_passed':0,'operational_warnings_checked':0,'operational_warnings_retained':0}
    for r in runs:
        assert usage_totals(r['model_requests'])==r['usage']
        for c in r.get('accepted_choices',[]):
            validation['accepted_choices']+=1;p=programs.get(c['program_id']);validation['valid_ids']+=int(p is not None)
            m=next(m for m in match_catalog(load_catalog(),TeacherRequest(**r['teacher_request']).matching_input()) if m['program_id']==c['program_id'])
            validation['correct_labels']+=int(c['category']=={'pass':'eligible','unknown':'provisional'}.get(m['eligibility_status']))
            for ref in c['evidence']:
                validation['references']+=1;validate_refs([EvidenceRef(**ref)],p);validation['valid_references']+=1
            for key in ('official_name','official_url','grade_levels','price','duration','published_standards'):
                validation['authoritative_fact_checks']+=1;validation['authoritative_fact_checks_passed']+=int(c['museum_facts'][key]==p[key])
            validation['authoritative_fact_checks']+=1;validation['authoritative_fact_checks_passed']+=int(c['eligibility']['program_fee']['subtotal']==m['program_fee']['subtotal'])
            for op in m['operational_confirmation']:
                validation['operational_warnings_checked']+=1
                validation['operational_warnings_retained']+=int(op in c['eligibility']['operational_confirmation'] and not c['eligibility']['booking_confirmed'])
    for sid in ('A01','A02','A03'):
        group={r['condition']:r for r in runs if r['scenario']==sid and r['agent']=='Program Advisor'}
        if len(group)!=2:continue
        a,b=group['full'],group['shortlist']
        pairs.append({'scenario':sid,'full':{k:a[k] for k in ('artifact','status','usage','cache_write_tokens','model_request_count','latency_seconds')},
          'shortlist':{k:b[k] for k in ('artifact','status','usage','cache_write_tokens','model_request_count','latency_seconds')},
          'input_reduction_fraction':1-b['usage']['input_tokens']/a['usage']['input_tokens'],
          'candidate_counts':{k:len(next(t['result'] for t in v['tools'] if t['tool']=='search_matching_programs')) for k,v in group.items()},
          'tool_context_bytes':{k:len(json.dumps(next(t['result'] for t in v['tools'] if t['tool']=='search_matching_programs'),ensure_ascii=False).encode()) for k,v in group.items()},
          'choices':{k:[c['program_id'] for c in v.get('accepted_choices',[])] for k,v in group.items()}})
    summaries={}
    for condition in ('full','shortlist'):
        subset=[r for r in runs if r['condition']==condition and r['agent']=='Program Advisor']
        reqs=[q for r in subset for q in r['model_requests']]
        summaries[condition]={'usage':usage_totals(reqs),'cache_write_tokens':sum(q['cache_write_tokens'] for q in reqs),'requests':len(reqs),'passed_runs':sum(r['status']=='passed' for r in subset),'runs':len(subset),'median_latency_seconds':statistics.median(r['latency_seconds'] for r in subset)}
    allreq=[q for r in runs for q in r['model_requests']];unique={}
    for q in allreq:
        key=q.get('provider_response_id')
        if key:
            if key in unique:assert unique[key]['input_tokens']==q['input_tokens'] and unique[key]['output_tokens']==q['output_tokens']
            unique[key]=q
    complete=[];projection=[]
    units=[]
    for condition in ('full','shortlist'):
        subset=[r for r in runs if r['scenario']=='A01' and r['condition']==condition]
        if len(subset)!=2:continue
        reqs=[q for r in subset for q in r['model_requests']];usage=usage_totals(reqs);writes=sum(q['cache_write_tokens'] for q in reqs)
        lo,hi=cost_bounds(usage,writes)
        item={'condition':condition,'status':'passed' if all(r['status']=='passed' for r in subset) else 'failed','usage':usage,'cache_write_tokens':writes,'requests':len(reqs),'latency_seconds':round(sum(r['latency_seconds'] for r in subset),3),'illustrative_usd_min':lo,'illustrative_usd_max':hi,'course_cost':None,'sources':[r['artifact'] for r in subset]}
        complete.append(item)
        if item['status']=='passed':units.append((condition,usage,writes,len(reqs),lo,hi))
    history=json.loads((OUT/'usage_audit.json').read_text())['rows']
    for stage in (3,4):
        chosen=[r for r in history if (stage==3 and 'case-a-' in r['source']) or (stage==4 and r['source'].endswith('browser-live.json'))]
        usage=usage_totals([q for r in chosen for q in r['requests']]);lo,hi=cost_bounds(usage,None)
        units.append((f'historical_stage{stage}',usage,None,sum(r['model_requests'] for r in chosen),lo,hi))
    for label,usage,writes,requests,lo,hi in units:
        for users in (1,100,10000):
            for frequency in (1,3):
                projection.append({'basis':label,'period':'month','users':users,'workflows_per_user':frequency,'total_workflows':users*frequency,'requests_per_workflow':requests,
                 **usage,'cache_write_tokens':writes,'illustrative_usd_min':round(lo*users*frequency,9),'illustrative_usd_max':round(hi*users*frequency,9),'course_gateway_cost':'unknown','price_basis':'OpenAI public Standard list rates; not verified course billing; assumed each gateway transaction chargeable'})
    with (OUT/'cost_model.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(projection[0]));w.writeheader();w.writerows(projection)
    data={'analyzed_at':timestamp(),'runs':len(runs),'successful_runs':sum(r['status']=='passed' for r in runs),'pairs':pairs,'advisor_totals':summaries,'validation':validation,'complete_workflows':complete,
      'new_gateway_requests':len(allreq),'reported_transaction_usage':usage_totals(allreq),'cache_write_tokens':sum(q['cache_write_tokens'] for q in allreq),'unique_provider_response_ids':len(unique),'unique_response_usage':usage_totals(list(unique.values())),
      'response_id_caveat':'Repeated first-round response IDs were observed in equivalent prompts across conditions. All outbound gateway requests are counted; unique response-payload usage is separately deduplicated. This may reflect gateway response reuse, but cache headers/billing are unavailable. Do not call summed transaction usage unique new provider computation or actual charges.',
      'pricing':{'source':'https://developers.openai.com/api/docs/models/gpt-6-luna','cache_semantics_source':'https://developers.openai.com/api/docs/guides/prompt-caching','accessed_on':'2026-10-23','usd_per_million':RATES,'course_rates':None,'assumptions':'Standard public price, no regional premium, no gateway/hosting/support fees; writes and cache reads are disjoint subsets of input. Historical missing writes range from zero to all noncached input.'}}
    (OUT/'context_comparison.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({k:data[k] for k in ('runs','successful_runs','new_gateway_requests','reported_transaction_usage','cache_write_tokens','unique_provider_response_ids','validation','complete_workflows')},indent=2))
if __name__=='__main__':main()
