"""Offline checks of evaluation safeguards and arithmetic, separate from product tests."""
import json
import pytest
from backend.gateway import ExecutionLimit
from backend.models import TeacherRequest
from matching import load_catalog,match_catalog
from evaluation.context_experiment import Budget,ExperimentalContext
from evaluation.summarize import cost_bounds
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def test_global_budget_persists_and_rejects_request_25(tmp_path):
    path=tmp_path/'budget.json'
    for n in range(24):assert Budget(path).reserve()==n+1
    with pytest.raises(ExecutionLimit):Budget(path).reserve()
    assert json.loads(path.read_text())['used']==24

def test_budget_mismatch_is_not_reset(tmp_path):
    path=tmp_path/'budget.json';path.write_text(json.dumps({'limit':99,'used':0,'reservations':[]}))
    with pytest.raises(ExecutionLimit):Budget(path).reserve()

@pytest.mark.parametrize('idx,count',[(0,16),(1,16),(2,4)])
def test_context_membership_and_no_eligible_program_loss(idx,count):
    scenario=json.loads((ROOT/'artifacts/stage5/evaluation_scenarios.json').read_text())['scenarios'][idx]
    t=TeacherRequest(**scenario['teacher_request']);catalog=load_catalog()
    ctx=ExperimentalContext(catalog,t,{'tools':[]});ctx.condition='full'
    full=ctx.emit('search_matching_programs',{},[])
    assert len(full)==20
    eligible=[m['program_id'] for m in match_catalog(catalog,t.matching_input()) if m['eligibility_status']!='fail']
    assert len(eligible)==count
    assert {p['program_id'] for p in full if p['eligibility_status']!='fail'}==set(eligible)
    assert len(json.dumps(full,ensure_ascii=False).encode())<=24000

def test_cache_classes_not_double_charged():
    lo,hi=cost_bounds({'input_tokens':1000,'cached_input_tokens':200,'output_tokens':400},100)
    # 700 ordinary, 200 cached, 100 writes, 400 output, USD per million.
    assert lo==hi==pytest.approx(.0002845)
    lo,hi=cost_bounds({'input_tokens':1000,'cached_input_tokens':200,'output_tokens':400},None)
    assert lo==pytest.approx(.000282);assert hi==pytest.approx(.000302)
    with pytest.raises(AssertionError):cost_bounds({'input_tokens':1000,'cached_input_tokens':200,'output_tokens':400},801)
