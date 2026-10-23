"""Create a clearly labeled second-program UI fixture, without model inference.

Reuses real catalog facts and matching; teaching text is hand-authored test content.
Run from the project root: .venv/bin/python frontend/scripts/stage4-4-fixtures.py
"""
import json
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from matching import load_catalog, match_catalog
from backend.models import TeacherRequest
from backend.validation import facts
base = json.loads((ROOT / 'artifacts/stage4_1/offline-fixtures.json').read_text())
request = TeacherRequest.model_validate(base['cases']['provided']['request'])
catalog = load_catalog()
p = next(p for p in catalog['programs'] if p['id'] == 'ewm-simple-machines')
m = next(m for m in match_catalog(catalog, request.matching_input()) if m['program_id'] == p['id'])
assert m['eligibility_status'] == 'pass'
response = base['cases']['provided']['response']
candidate = dict(response['recommendations'][0])
candidate.update(program_id=p['id'], museum_facts=facts(p).model_dump(), eligibility=m,
                 ai_educational_reasoning='Offline replacement test with actual catalog facts; no new AI recommendation.',
                 evidence=[{'program_id':p['id'],'field':'/description','source_id':'program_page'}])
response['recommendations'] = [candidate]
response['provisional_options'] = []
journey = base['journey']
journey.update(program_id=p['id'], museum_facts=facts(p).model_dump(), eligibility=m,
               safety_notice='Follow museum staff directions. This is offline UI test content.',
               suggestion_label='Hand-authored offline test suggestions; not a live AI plan or museum curriculum.')
s = journey['ai_teaching_suggestions']
s['program_id'] = p['id']
s['evidence'] = candidate['evidence']
for phase in ['before','during','after']:
    for key, value in s[phase].items():
        s[phase][key] = ['Offline test: record actual observations and discuss how a simple machine works.'] if isinstance(value,list) else 'Offline test: compare actual observations with labeled predictions.'
(ROOT/'artifacts/stage4_4/replacement-fixture.json').write_text(json.dumps({'kind':'Offline UI fixture; real catalog/matcher, hand-authored teaching text, no inference','response':response,'journey':journey,'catalog':[facts(item).model_dump() for item in catalog['programs']]},indent=2)+'\n')
