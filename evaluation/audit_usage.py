"""Deduplicate historical real traces by run ID; never infer absent usage."""
import json
from pathlib import Path
from backend.gateway import timestamp, usage_totals
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'artifacts/stage5'
def main():
 rows=[];seen=set()
 sources=[(p,None) for p in sorted((ROOT/'artifacts/agent_runs').glob('*.json'))]
 for name in ('browser-attempt-1.json','browser-live.json'):
  p=ROOT/'artifacts/stage4'/name
  sources.extend((p,i) for i in range(len(json.loads(p.read_text())['records'])))
 for p,index in sources:
  d=json.loads(p.read_text());d=d['records'][index] if index is not None else d;t=d.get('run_trace',d)
  if t['run_id'] in seen:continue
  seen.add(t['run_id']);requests=t.get('model_requests',[]);totals=usage_totals(requests)
  assert totals==t['usage'],p
  rows.append(dict(source=str(p.relative_to(ROOT)),record_index=index,run_id=t['run_id'],stage=4 if index is not None else 3,
   agent=t.get('agent'),status=t['status'],execution_kind='real_portkey',timestamp=t['timestamp'],
   provider_responded=any(r.get('http_status')==200 for r in requests),model_requests=len(requests),usage=totals,
   cache_write_tokens=None,provider_request_ids=None,latency_seconds=t.get('latency_seconds'),
   reported_models=sorted({r['reported_model'] for r in requests if r.get('reported_model')}),
   error=t.get('error'),validation_failure=t.get('validation_failure'),
   requests=[r|{'cache_write_tokens':None,'provider_response_id':None} for r in requests]))
 summaries={}
 for stage in (3,4):
  chosen=[r for r in rows if r['stage']==stage and r['provider_responded']]
  summaries[str(stage)]={'responded_agent_runs':len(chosen),'passed':sum(r['status']=='passed' for r in chosen),'failed':sum(r['status']!='passed' for r in chosen),
    'model_requests':sum(r['model_requests'] for r in chosen),'usage':usage_totals([req for r in chosen for req in r['requests']]),'cache_write_tokens':None}
 data={'audited_at':timestamp(),'rows':rows,'stage_totals':summaries,
  'classification_notes':[
   'Each Case C artifact has a distinct run ID and outbound request timestamps. The diagnostic and validated artifacts are real new attempts, not local validator-only replays. Identical usage is not sufficient evidence of a duplicated provider response.',
   'Provider response/request IDs and cache-write fields were not retained historically. Run-ID/request-index deduplication prevents counting duplicated exports; upstream gateway cache reuse cannot be reconstructed.',
   'Stage 4 browser-attempt-1 contains a successful Advisor and failed Designer; browser-live contains the successful two-agent retry. Both are retained.',
   'Sandbox smoke failure records an outbound attempt without provider response; usage stays null and is excluded from observed-token sums.',
   'Historical Stage 4.1–4.4 browser responses and frontend fixtures replay earlier content; all FunctionModel tests and local validator re-executions add zero live usage and are excluded.',
   'The two successful historical complete workflows are Case A Stage 3 and browser-live Stage 4. Summed agent latency excludes human selection.']}
 (OUT/'usage_audit.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(summaries,indent=2))
if __name__=='__main__':main()
